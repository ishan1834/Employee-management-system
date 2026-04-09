import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
}
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailViaBrevo(to: string, subject: string, htmlContent: string) {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) throw new Error("BREVO_API_KEY not configured");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "THRYLOS", email: "noreply@admin.thrylos.in" },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorBody}`);
  }

  return await response.json();
}
function buildOtpEmailHtml(otpCode: string, userName: string, profilePic: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>THRYLOS OTP</title>
</head>
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial;">
<div style="text-align:center;padding:40px;">
<h1>Welcome back ${userName}!</h1>
<img src="${profilePic}" width="80" style="border-radius:50%;" />
<p>Your OTP code is:</p>
<h2>${otpCode}</h2>
<p>If you didn't request this, ignore it.</p>
</div>
</body>
</html>`;
}
async function handleOTPLogic(email: string, supabase: any) {
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, name, email, otp_email, is_active, status, avatar")
    .eq("email", email)
    .single();

  if (error || !admin) throw new Error("Admin not found");

  if (!admin.is_active) throw new Error("Account disabled");
  if (admin.status === "suspended") throw new Error("Account suspended");
  if (admin.status === "on_leave") throw new Error("Account on leave");

  const otpCode = generateOTP();
  const otpTargetEmail = admin.otp_email || admin.email;

  await supabase
    .from("otp_sessions")
    .delete()
    .eq("admin_id", admin.id)
    .eq("is_used", false);

  const { error: insertError } = await supabase
    .from("otp_sessions")
    .insert({
      admin_id: admin.id,
      login_email: admin.email,
      otp_email: otpTargetEmail,
      otp_code: otpCode,
    });

  if (insertError) throw new Error("Failed to store OTP");

  return { admin, otpCode, otpTargetEmail };
}
