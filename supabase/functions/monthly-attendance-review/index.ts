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

    // Parse body for configurable settings
    let minDaysThreshold = 20;
    let suspensionDays = 7;
    let reviewCurrentMonth = false;

    try {
      const body = await req.json();
      if (body.min_days_threshold) minDaysThreshold = body.min_days_threshold;
      if (body.suspension_days) suspensionDays = body.suspension_days;
      if (body.review_current_month) reviewCurrentMonth = body.review_current_month;
    } catch {
      // No body or invalid JSON, use defaults from DB
    }

    // Try to get settings from DB if not provided in body
    const { data: settingsRow } = await supabase
      .from("attendance_settings")
      .select("min_days_threshold, suspension_days")
      .limit(1)
      .single();

    if (settingsRow) {
      // Body overrides DB settings, but DB provides defaults
      if (!minDaysThreshold || minDaysThreshold === 20) minDaysThreshold = settingsRow.min_days_threshold;
      if (!suspensionDays || suspensionDays === 7) suspensionDays = settingsRow.suspension_days;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed

    // Review current month if flag set, otherwise previous month
    let reviewMonth: number;
    let reviewYear: number;
    
    if (reviewCurrentMonth) {
      reviewMonth = month + 1; // 1-indexed
      reviewYear = year;
    } else {
      reviewMonth = month === 0 ? 12 : month;
      reviewYear = month === 0 ? year - 1 : year;
    }

    // Get all active admins
    const { data: admins, error: adminsError } = await supabase
      .from("admins")
      .select("id, name, role")
      .eq("is_active", true);

    if (adminsError) throw adminsError;

    // Get holidays for the review month
    const monthStart = `${reviewYear}-${String(reviewMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(reviewYear, reviewMonth, 0).getDate();
    const monthEnd = `${reviewYear}-${String(reviewMonth).padStart(2, "0")}-${lastDay}`;

    const { data: holidays } = await supabase
      .from("holidays")
      .select("date")
      .gte("date", monthStart)
      .lte("date", monthEnd);

    const holidayDates = new Set((holidays || []).map((h: any) => h.date));

    // Calculate working days (exclude weekends and holidays)
    // For current month, only count up to today
    const todayDate = now.getDate();
    const maxDay = reviewCurrentMonth ? todayDate : lastDay;

    let workingDays = 0;
    const workingDatesList: string[] = [];
    for (let day = 1; day <= maxDay; day++) {
      const d = new Date(reviewYear, reviewMonth - 1, day);
      const dayOfWeek = d.getDay();
      const dateStr = `${reviewYear}-${String(reviewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        workingDays++;
        workingDatesList.push(dateStr);
      }
    }

    // Use configurable threshold, capped to working days
    const effectiveThreshold = Math.min(minDaysThreshold, workingDays);

    const results: any[] = [];

    for (const admin of admins || []) {
      if (admin.role === "super_admin") continue;

      // Get attendance for the review month
      const { data: attendance } = await supabase
        .from("attendance")
        .select("status, date")
        .eq("admin_id", admin.id)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      const attendanceDates = new Set((attendance || []).map((a: any) => a.date));

      // Check work logs based on role
      let workLogDates = new Set<string>();

      if (admin.role === "tech_admin") {
        const { data: techLogs } = await supabase
          .from("tech_work_logs")
          .select("created_at")
          .eq("admin_id", admin.id)
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd + "T23:59:59");
        (techLogs || []).forEach((l: any) => {
          workLogDates.add(l.created_at.split("T")[0]);
        });
      } else if (admin.role === "content_admin" || admin.role === "social_admin") {
        const { data: contentLogs } = await supabase
          .from("content_work_logs")
          .select("created_at")
          .eq("admin_id", admin.id)
          .gte("created_at", monthStart)
          .lte("created_at", monthEnd + "T23:59:59");
        (contentLogs || []).forEach((l: any) => {
          workLogDates.add(l.created_at.split("T")[0]);
        });
      }

      // For non-esports admins: mark absent on working days with no attendance AND no work log
      if (admin.role !== "esports_admin") {
        for (const dateStr of workingDatesList) {
          if (!attendanceDates.has(dateStr) && !workLogDates.has(dateStr)) {
            await supabase.from("attendance").insert({
              admin_id: admin.id,
              date: dateStr,
              status: "absent",
              marked_by: admin.id,
              marked_at: new Date().toISOString(),
            });
          }
        }
      }

      // Re-fetch attendance after marking absents
      const { data: updatedAttendance } = await supabase
        .from("attendance")
        .select("status")
        .eq("admin_id", admin.id)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      const presentDays = (updatedAttendance || []).filter((a: any) => a.status === "present").length;
      const lateDays = (updatedAttendance || []).filter((a: any) => a.status === "late").length;
      const absentDays = (updatedAttendance || []).filter((a: any) => a.status === "absent").length;
      const totalPresent = presentDays + Math.floor(lateDays * 0.5);

      const shouldSuspend = totalPresent < effectiveThreshold;

      const suspensionStart = shouldSuspend ? new Date().toISOString().split("T")[0] : null;
      const suspensionEnd = shouldSuspend
        ? new Date(Date.now() + suspensionDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        : null;

      // Delete existing review for same admin/month/year to avoid duplicates
      await supabase
        .from("monthly_attendance_reviews")
        .delete()
        .eq("admin_id", admin.id)
        .eq("month", reviewMonth)
        .eq("year", reviewYear);

      await supabase.from("monthly_attendance_reviews").insert({
        admin_id: admin.id,
        month: reviewMonth,
        year: reviewYear,
        present_days: presentDays,
        late_days: lateDays,
        absent_days: absentDays,
        total_working_days: workingDays,
        is_suspended: shouldSuspend,
        suspension_start: suspensionStart,
        suspension_end: suspensionEnd,
      });

      if (shouldSuspend) {
        await supabase
          .from("admins")
          .update({ status: "suspended" })
          .eq("id", admin.id);

        await supabase.from("admin_notifications").insert({
          title: "Account Suspended - Low Attendance",
          message: `Your account has been suspended for ${suspensionDays} days due to low attendance (${totalPresent}/${effectiveThreshold} days) in ${reviewYear}-${String(reviewMonth).padStart(2, "0")}.`,
          priority: "urgent",
          recipient_type: "specific",
          recipients: [admin.id],
        });
      }

      results.push({
        admin: admin.name,
        role: admin.role,
        present: totalPresent,
        threshold: effectiveThreshold,
        absent: absentDays,
        suspended: shouldSuspend,
      });
    }

    return new Response(JSON.stringify({ success: true, results, workingDays, threshold: effectiveThreshold, suspensionDays, reviewMonth, reviewYear }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
