import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("get-location: start");

    const xForwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const cfConnectingIp = req.headers.get("cf-connecting-ip")?.trim();
    const candidateIp = cfConnectingIp || xForwardedFor;

    let locationData = {
      ip: "Unknown",
      city: "Unknown",
      region: "Unknown",
      country: "Unknown",
      isp: "Unknown",
      timezone: "Unknown",
    };

    // Primary: ipwho.is (no token, HTTPS)
    try {
      const url = candidateIp ? `https://ipwho.is/${encodeURIComponent(candidateIp)}` : "https://ipwho.is/";
      const res = await fetch(url, { headers: { Accept: "application/json" } });

      if (res.ok) {
        const geo = await res.json();
        console.log("get-location: ipwho.is", geo);

        if (geo && geo.success !== false) {
          locationData = {
            ip: geo.ip || locationData.ip,
            city: geo.city || locationData.city,
            region: geo.region || locationData.region,
            country: geo.country || locationData.country,
            isp: geo?.connection?.isp || locationData.isp,
            timezone: geo?.timezone?.id || locationData.timezone,
          };
        }
      }
    } catch (e) {
      console.error("get-location: ipwho.is failed", e);
    }

    // Fallback: ipapi.co (no token, HTTPS)
    if (locationData.ip === "Unknown") {
      try {
        const res = await fetch("https://ipapi.co/json/", { headers: { Accept: "application/json" } });
        if (res.ok) {
          const geo = await res.json();
          console.log("get-location: ipapi.co", geo);

          locationData = {
            ip: geo.ip || locationData.ip,
            city: geo.city || locationData.city,
            region: geo.region || locationData.region,
            country: geo.country_name || geo.country || locationData.country,
            isp: geo.org || locationData.isp,
            timezone: geo.timezone || locationData.timezone,
          };
        }
      } catch (e) {
        console.error("get-location: ipapi.co failed", e);
      }
    }

    console.log("get-location: final", locationData);

    return new Response(JSON.stringify(locationData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("get-location: error", error);
    return new Response(
      JSON.stringify({
        error: error?.message || "Unknown error",
        ip: "Unknown",
        city: "Unknown",
        region: "Unknown",
        country: "Unknown",
        isp: "Unknown",
        timezone: "Unknown",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
