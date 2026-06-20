import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, phone, message, type } = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const provider = Deno.env.get("WHATSAPP_PROVIDER") || "none";

    console.log(`Processing WhatsApp notification via provider [${provider}] to phone [${phone}]`);

    if (provider === "twilio") {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID") || "";
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN") || "";
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER") || ""; // e.g. +14155238886 (Twilio Sandbox)

      if (!accountSid || !authToken || !fromNumber) {
        throw new Error("Twilio provider configured but credentials (SID/Token/Number) are missing");
      }

      // Format from/to for WhatsApp
      const twilioFrom = fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`;
      const twilioTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append("From", twilioFrom);
      formData.append("To", twilioTo);
      formData.append("Body", message);

      const authHeader = "Basic " + btoa(`${accountSid}:${authToken}`);

      const twilioRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": authHeader
        },
        body: formData.toString()
      });

      if (!twilioRes.ok) {
        const errText = await twilioRes.text();
        throw new Error(`Twilio API Error: ${errText}`);
      }

      const resJson = await twilioRes.json();
      return new Response(
        JSON.stringify({ success: true, provider: "twilio", data: resJson }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (provider === "meta") {
      const accessToken = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN") || "";
      const phoneId = Deno.env.get("META_WHATSAPP_PHONE_NUMBER_ID") || "";

      if (!accessToken || !phoneId) {
        throw new Error("Meta WhatsApp provider configured but credentials (Access Token/Phone ID) are missing");
      }

      // Format phone for Meta (must be numbers only, with country code, e.g. 59899123456)
      const cleanPhone = phone.replace(/[^\d]/g, "");

      const metaUrl = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

      const metaRes = await fetch(metaUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: message
          }
        })
      });

      if (!metaRes.ok) {
        const errText = await metaRes.text();
        throw new Error(`Meta Graph API Error: ${errText}`);
      }

      const resJson = await metaRes.json();
      return new Response(
        JSON.stringify({ success: true, provider: "meta", data: resJson }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      // "none" or other - Simulation Mode
      console.log(`[SIMULATION] WhatsApp message logged successfully:
To: ${phone}
Message: ${message}
Type: ${type || "general"}`);

      return new Response(
        JSON.stringify({
          success: true,
          provider: "none",
          simulated: true,
          message: "WhatsApp simulation executed successfully"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error("Error in send-whatsapp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
