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
    console.error("Brevo API error:", errorBody);
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
<body style="margin:0; padding:0; background:#ffffff; font-family:Arial, Helvetica, sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff">
<tr>
<td align="center" style="padding:30px 10px;">
<table width="600" cellpadding="0" cellspacing="0" 
style="max-width:600px;width:100%;border:1px solid #d1d5db;border-radius:12px;overflow:hidden;">
<tr>
<td align="center" bgcolor="#f3f4f6" style="padding:18px;">
<img src="https://github.com/user-attachments/assets/160c433a-e006-42ee-8923-f6360223e116" alt="THRYLOS Logo" width="120" style="display:block;">
</td>
</tr>
<tr>
<td align="center" style="padding-top:30px;">
<img src="${profilePic}" alt="User Profile Picture" width="80" style="display:block;border-radius:50%;border:3px solid #e5e7eb;">
</td>
</tr>
<tr>
<td align="center" style="padding:20px 20px 10px 20px;">
<h1 style="font-size:32px; margin:0; font-weight:800; color:#1f2937;">Welcome back ${userName}!</h1>
</td>
</tr>
<tr>
<td align="center" style="padding:20px;">
<table width="90%" cellpadding="0" cellspacing="0" 
style="background:#f5f5f5;border-radius:16px;padding:20px;">
<tr>
<td style="font-size:16px;color:#555;padding:10px 20px 5px 20px;">Logging in to</td>
</tr>
<tr>
<td style="padding:5px 20px 15px 20px;">
<table width="100%">
<tr>
<td style="font-size:16px;font-weight:bold;color:#1f2937;">THRYLOS</td>
<td align="right">
<img src="https://github.com/user-attachments/assets/eea77779-ee10-4d58-bf62-e374dff4a6ab" width="44" style="display:block;border-radius:6px;">
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="border-top:1px solid #ddd;padding-top:12px;"></td>
</tr>
<tr>
<td style="font-size:16px;color:#555;padding:10px 20px 5px 20px;">From</td>
</tr>
<tr>
<td style="padding:5px 20px 15px 20px;">
<table width="100%">
<tr>
<td style="font-size:16px;font-weight:bold;color:#1f2937;">India</td>
<td align="right">
<img src="https://github.com/user-attachments/assets/3738239c-dc89-4d91-b96d-c845c2adcf64" width="35" style="display:block;border-radius:6px;">
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
<tr>
<td align="center" style="padding:30px 40px 10px 40px;font-size:16px;color:#444;">
If you requested to log in to your THRYLOS ID, use the code below.
</td>
</tr>
<tr>
<td align="center" style="padding:10px 0 20px 0;">
<div style="background:#4f7cff;color:#fff;font-size:32px;font-weight:bold;padding:18px 36px;border-radius:14px;display:inline-block;letter-spacing:4px;">
${otpCode}
</div>
</td>
</tr>
<tr>
<td align="center" style="padding:0 40px 40px 40px;font-size:14px;color:#666;">
If you didn't request to log in to your THRYLOS ID, you can safely ignore this email.
</td>
</tr>
<tr>
<td bgcolor="#000000" style="padding:20px;">
<table width="100%">
<tr>
<td style="color:#ffffff;font-size:14px;">&copy; 2026 THRYLOS. All rights reserved.</td>
<td align="right">
<img src="https://github.com/user-attachments/assets/160c433a-e006-42ee-8923-f6360223e116" width="90">
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: SendOTPRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Looking up admin with login email:", email);

    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, name, email, otp_email, is_active, status, avatar")
      .eq("email", email)
      .single();

    if (adminError || !admin) {
      console.error("Admin not found:", adminError);
      return new Response(
        JSON.stringify({ error: "No admin account found with this email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!admin.is_active) {
      return new Response(
        JSON.stringify({ error: "Your account has been disabled. Please contact super admin." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (admin.status === "suspended") {
      return new Response(
        JSON.stringify({ error: "Your account has been suspended. Please contact super admin." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (admin.status === "on_leave") {
      return new Response(
        JSON.stringify({ error: "You are currently on leave and cannot login. Please contact super admin when you return." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const otpTargetEmail = admin.otp_email || admin.email;
    const otpCode = generateOTP();

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

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const profilePic = admin.avatar || "https://github.com/user-attachments/assets/160c433a-e006-42ee-8923-f6360223e116";
    const userName = admin.name || "Admin";

    const htmlContent = buildOtpEmailHtml(otpCode, userName, profilePic);
    const emailResponse = await sendEmailViaBrevo(
      otpTargetEmail,
      "Your OTP for login to Thrylos Admin Portal",
      htmlContent
    );

    console.log("OTP email sent via Brevo:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to your registered email" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
