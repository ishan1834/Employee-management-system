import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otp: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, otp }: VerifyOTPRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Verifying OTP for email:", email);

    const { data: otpSession, error: otpError } = await supabase
      .from("otp_sessions")
      .select("*")
      .eq("login_email", email)
      .eq("otp_code", otp)
      .eq("is_used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpSession) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new one." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabase
      .from("otp_sessions")
      .update({
        is_used: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", otpSession.id);

    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", otpSession.admin_id)
      .single();

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ error: "Admin account not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!admin.is_active) {
      return new Response(
        JSON.stringify({ error: "Your account has been disabled. Please contact super admin." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (admin.status === "suspended" || admin.status === "on_leave") {
      return new Response(
        JSON.stringify({ error: "Your account is not allowed to login currently." }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    let userId = admin.user_id;

    if (!userId) {
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();

      const { data: authUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: admin.email,
          password: tempPassword,
          email_confirm: true,
        });

      if (createError) {
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u) => u.email === admin.email
        );

        if (existingUser) {
          userId = existingUser.id;
        } else {
          return new Response(
            JSON.stringify({ error: "Failed to setup authentication" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        userId = authUser.user.id;
      }

      await supabase
        .from("admins")
        .update({ user_id: userId })
        .eq("id", admin.id);
    }

    const { data: signInData, error: signInError } =
      await supabase.auth.admin.generateLink({
        type: "magiclink",
        email: admin.email,
        options: {
          redirectTo: `${req.headers.get("origin") || "https://muesportsindia-admin.lovable.app"}/dashboard`,
        },
      });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Failed to complete authentication" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabase
      .from("admins")
      .update({ last_login: new Date().toISOString() })
      .eq("id", admin.id);

    const hashed_token = signInData.properties?.hashed_token;
    const verification_type = signInData.properties?.verification_type;

    return new Response(
      JSON.stringify({
        success: true,
        message: "OTP verified successfully",
        adminId: admin.id,
        email: admin.email,
        actionLink: signInData.properties?.action_link,
        token_hash: hashed_token,
        type: verification_type,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
