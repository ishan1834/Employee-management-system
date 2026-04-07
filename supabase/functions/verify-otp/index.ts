import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string; // Login email
  otp: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
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

    // Find valid OTP session
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
      console.error("Invalid or expired OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP. Please request a new one." }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as used
    await supabase
      .from("otp_sessions")
      .update({ 
        is_used: true,
        verified_at: new Date().toISOString()
      })
      .eq("id", otpSession.id);

    // Get admin details
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

    // Re-check admin status at verification time
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

    // Check if admin has a linked auth user, if not create one
    let userId = admin.user_id;
    
    if (!userId) {
      // Create auth user for this admin (using a random secure password since we use OTP)
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email: admin.email,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError) {
        // User might already exist
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === admin.email);
        
        if (existingUser) {
          userId = existingUser.id;
        } else {
          console.error("Error creating auth user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to setup authentication" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        userId = authUser.user.id;
      }

      // Link user_id to admin
      await supabase
        .from("admins")
        .update({ user_id: userId })
        .eq("id", admin.id);
    }

    // Generate a magic link / sign in token
    // We use a custom session approach - generate a session token
    const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: admin.email,
      options: {
        redirectTo: `${req.headers.get("origin") || "https://muesportsindia-admin.lovable.app"}/dashboard`,
      },
    });

    if (signInError) {
      console.error("Error generating sign-in link:", signInError);
      return new Response(
        JSON.stringify({ error: "Failed to complete authentication" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update last login
    await supabase
      .from("admins")
      .update({ last_login: new Date().toISOString() })
      .eq("id", admin.id);

    console.log("OTP verified successfully for:", email);

    // Extract the token from the magic link
    const hashed_token = signInData.properties?.hashed_token;
    const verification_type = signInData.properties?.verification_type;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "OTP verified successfully",
        adminId: admin.id,
        email: admin.email,
        // Return the action link for client to process
        actionLink: signInData.properties?.action_link,
        // Also return token info for direct verification
        token_hash: hashed_token,
        type: verification_type
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
