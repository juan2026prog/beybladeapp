// Follow Deno/Supabase standards for Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text } = await req.json();

    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, body (html or text)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email to ${to} with subject "${subject}"`);

    // Boilerplate for Resend API Integration in production
    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Beyblade Uruguay <no-reply@beyblade.uy>",
          to: [to],
          subject,
          html: html || text,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend API Error: ${errText}`);
      }

      const resData = await res.json();
      return new Response(
        JSON.stringify({ success: true, message: "Email sent successfully", data: resData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Mock mode for local testing
      return new Response(
        JSON.stringify({
          success: true,
          message: "Simulation: Email sent successfully (Mock Mode, no RESEND_API_KEY configured)",
          data: { id: `mock-email-${Date.now()}` }
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
