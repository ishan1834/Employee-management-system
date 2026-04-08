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

    let minDaysThreshold = 20;
    let suspensionDays = 7;
    let reviewCurrentMonth = false;

    try {
      const body = await req.json();
      if (body.min_days_threshold) minDaysThreshold = body.min_days_threshold;
      if (body.suspension_days) suspensionDays = body.suspension_days;
      if (body.review_current_month) reviewCurrentMonth = body.review_current_month;
    } catch {}
    const { data: settingsRow } = await supabase
      .from("attendance_settings")
      .select("min_days_threshold, suspension_days")
      .limit(1)
      .single();

    if (settingsRow) {
      if (!minDaysThreshold || minDaysThreshold === 20) {
        minDaysThreshold = settingsRow.min_days_threshold;
      }
      if (!suspensionDays || suspensionDays === 7) {
        suspensionDays = settingsRow.suspension_days;
      }
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let reviewMonth: number;
    let reviewYear: number;

    if (reviewCurrentMonth) {
      reviewMonth = month + 1;
      reviewYear = year;
    } else {
      reviewMonth = month === 0 ? 12 : month;
      reviewYear = month === 0 ? year - 1 : year;
    }
