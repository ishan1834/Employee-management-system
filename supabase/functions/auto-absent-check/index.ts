import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use IST timezone for date calculation
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split("T")[0];

    // Get all active admins (excluding esports and super admins)
    const { data: admins, error: adminsError } = await supabase
      .from("admins")
      .select("id, name, role")
      .eq("is_active", true)
      .not("role", "in", '("esports_admin","super_admin")');

    if (adminsError) throw adminsError;

    const results: any[] = [];

    for (const admin of admins || []) {
      // Check if attendance already exists for today
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("id, status, check_in_time")
        .eq("admin_id", admin.id)
        .eq("date", today)
        .single();

      // If already manually marked present or late, check if work log exists
      // If work log exists, keep status as is. If no work log, override to absent.
      if (existingAttendance && (existingAttendance.status === "present" || existingAttendance.status === "late")) {
        // Verify work log exists
        const hasWorkLog = await checkWorkLog(supabase, admin, today);
        
        if (hasWorkLog) {
          // Work log exists - keep attendance as is, determine status from check_in_time
          results.push({ admin: admin.name, action: "kept", reason: "work_log_exists", status: existingAttendance.status });
        } else {
          // No work log - override to absent
          await supabase
            .from("attendance")
            .update({ 
              status: "absent",
              override_reason: "Auto-absent: No work log submitted by 11:59 PM",
            })
            .eq("id", existingAttendance.id);
          results.push({ admin: admin.name, action: "overridden_to_absent", reason: "no_work_log" });
        }
        continue;
      }

      // Check if work log exists for today
      const hasWorkLog = await checkWorkLog(supabase, admin, today);

      if (hasWorkLog) {
        // Work log exists but no attendance record — auto-mark based on earliest work log time
        if (!existingAttendance) {
          // Get earliest work log time to determine status
          const status = await getStatusFromWorkLogTime(supabase, admin, today);
          
          await supabase.from("attendance").insert({
            admin_id: admin.id,
            date: today,
            status: status,
            check_in_time: now.toISOString(),
            marked_by: admin.id,
            marked_at: now.toISOString(),
          });
          results.push({ admin: admin.name, action: `auto_marked_${status}`, reason: "work_log_exists" });
        }
      } else {
        // No work log — mark absent
        if (existingAttendance) {
          await supabase
            .from("attendance")
            .update({ 
              status: "absent",
              override_reason: "Auto-absent: No work log submitted by 11:59 PM",
            })
            .eq("id", existingAttendance.id);
          results.push({ admin: admin.name, action: "updated_to_absent", reason: "no_work_log" });
        } else {
          await supabase.from("attendance").insert({
            admin_id: admin.id,
            date: today,
            status: "absent",
            marked_by: admin.id,
            marked_at: now.toISOString(),
          });
          results.push({ admin: admin.name, action: "marked_absent", reason: "no_work_log" });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, date: today, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function checkWorkLog(supabase: any, admin: any, today: string): Promise<boolean> {
  const todayStart = today + "T00:00:00";
  const todayEnd = today + "T23:59:59";

  if (admin.role === "tech_admin") {
    const { data } = await supabase
      .from("tech_work_logs")
      .select("id")
      .eq("admin_id", admin.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .limit(1);
    return (data || []).length > 0;
  } else if (admin.role === "content_admin" || admin.role === "social_admin") {
    const { data } = await supabase
      .from("content_work_logs")
      .select("id")
      .eq("admin_id", admin.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .limit(1);
    return (data || []).length > 0;
  } else if (admin.role === "hr_admin") {
    const { data: c } = await supabase
      .from("content_work_logs")
      .select("id")
      .eq("admin_id", admin.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .limit(1);
    const { data: t } = await supabase
      .from("tech_work_logs")
      .select("id")
      .eq("admin_id", admin.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .limit(1);
    return ((c || []).length > 0) || ((t || []).length > 0);
  }
  return false;
}

// Determine attendance status based on earliest work log creation time
// 6 AM - 11 AM = present, 11 AM - 5 PM = late, after 5 PM = absent
async function getStatusFromWorkLogTime(supabase: any, admin: any, today: string): Promise<string> {
  const todayStart = today + "T00:00:00";
  const todayEnd = today + "T23:59:59";
  let earliestTime: Date | null = null;

  const tables = [];
  if (admin.role === "tech_admin") {
    tables.push("tech_work_logs");
  } else if (admin.role === "content_admin" || admin.role === "social_admin") {
    tables.push("content_work_logs");
  } else if (admin.role === "hr_admin") {
    tables.push("content_work_logs", "tech_work_logs");
  }

  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select("created_at")
      .eq("admin_id", admin.id)
      .gte("created_at", todayStart)
      .lte("created_at", todayEnd)
      .order("created_at", { ascending: true })
      .limit(1);
    
    if (data && data.length > 0) {
      const logTime = new Date(data[0].created_at);
      if (!earliestTime || logTime < earliestTime) {
        earliestTime = logTime;
      }
    }
  }

  if (!earliestTime) return "absent";

  // Convert to IST for hour comparison
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(earliestTime.getTime() + istOffset);
  const hours = istTime.getUTCHours();

  if (hours >= 6 && hours < 11) return "present";
  if (hours >= 11 && hours < 17) return "late";
  return "absent";
}
