import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
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
