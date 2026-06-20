import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id, title, message, url, type } = await req.json();

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client targeting beyblade schema
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: "beyblade" },
      auth: { persistSession: false }
    });

    // Query user subscription preferences
    const { data: prefs, error: prefsError } = await supabaseClient
      .from("notification_preferences")
      .select("push_enabled, push_subscription")
      .eq("user_id", user_id)
      .maybeSingle();

    if (prefsError) {
      throw new Error(`Error fetching preferences: ${prefsError.message}`);
    }

    if (!prefs || !prefs.push_enabled || !prefs.push_subscription) {
      return new Response(
        JSON.stringify({ success: true, message: "Push not enabled or subscription missing for this user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:soporte@beyblade.uy";

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn("VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is missing. Simulating push notification delivery.");
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: "Simulation: Push notification sent (Keys missing)"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configure web-push
    webpush.setVapidDetails(
      VAPID_SUBJECT,
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );

    // Send push notification
    const payload = JSON.stringify({
      title,
      message,
      url: url || "/",
      type: type || "general"
    });

    const subscription = prefs.push_subscription;
    
    // Send it
    await webpush.sendNotification(subscription, payload);

    return new Response(
      JSON.stringify({ success: true, message: "Push notification sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-push function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
