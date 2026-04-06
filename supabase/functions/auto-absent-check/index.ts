import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);
    const today = istNow.toISOString().split("T")[0];
    const { data: admins, error: adminsError } = await supabase
      .from("admins")
      .select("id, name, role")
      .eq("is_active", true)
      .not("role", "in", '("esports_admin","super_admin")');

    if (adminsError) throw adminsError;

    const results: any[] = [];
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
        for (const admin of admins || []) {
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("id, status, check_in_time")
        .eq("admin_id", admin.id)
        .eq("date", today)
        .single();

      if (existingAttendance && (existingAttendance.status === "present" || existingAttendance.status === "late")) {
        const hasWorkLog = await checkWorkLog(supabase, admin, today);

        if (hasWorkLog) {
          results.push({ admin: admin.name, action: "kept", reason: "work_log_exists", status: existingAttendance.status });
        } else {
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

      const hasWorkLog = await checkWorkLog(supabase, admin, today);

      if (hasWorkLog) {
        if (!existingAttendance) {
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
