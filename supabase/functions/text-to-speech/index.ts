/**
 * Text-to-Speech Edge Function
 *
 * Converts text to speech using Google Cloud Text-to-Speech API
 * Returns base64-encoded audio that can be played on any platform
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Cloud TTS API endpoint
const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

// Default voice settings
const DEFAULT_VOICE = {
  languageCode: "en-US",
  name: "en-US-Neural2-D",
  ssmlGender: "MALE",
};

// Character voice mappings
const CHARACTER_VOICES: Record<string, { name: string; ssmlGender: string }> = {
  freud: { name: "en-US-Neural2-D", ssmlGender: "MALE" },      // Deep, calm
  jung: { name: "en-US-Neural2-J", ssmlGender: "MALE" },       // Warm, friendly
  adler: { name: "en-US-Neural2-A", ssmlGender: "MALE" },      // Clear, professional
  default: { name: "en-US-Neural2-F", ssmlGender: "FEMALE" },  // Warm female
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is authenticated
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { text, characterId, voice, languageCode, speakingRate, pitch } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Google Cloud API key from environment
    const googleApiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
    if (!googleApiKey) {
      console.error("[TTS] Google Cloud API key not configured");
      return new Response(
        JSON.stringify({ error: "TTS service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine voice settings
    let voiceConfig = { ...DEFAULT_VOICE };

    if (characterId && CHARACTER_VOICES[characterId.toLowerCase()]) {
      const charVoice = CHARACTER_VOICES[characterId.toLowerCase()];
      voiceConfig.name = charVoice.name;
      voiceConfig.ssmlGender = charVoice.ssmlGender;
    } else if (voice) {
      voiceConfig.name = voice;
    }

    if (languageCode) {
      voiceConfig.languageCode = languageCode;
    }

    // Prepare Google Cloud TTS request
    const ttsRequest = {
      input: { text },
      voice: voiceConfig,
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: speakingRate || 1.0,
        pitch: pitch || 0.0,
        effectsProfileId: ["small-bluetooth-speaker-class-device"], // Optimized for mobile
      },
    };

    console.log(`[TTS] Synthesizing ${text.length} chars with voice ${voiceConfig.name}`);

    // Call Google Cloud TTS API
    const ttsResponse = await fetch(`${GOOGLE_TTS_URL}?key=${googleApiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ttsRequest),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("[TTS] Google Cloud TTS error:", errorText);
      return new Response(
        JSON.stringify({ error: "TTS synthesis failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ttsData = await ttsResponse.json();

    console.log("[TTS] Success, audio length:", ttsData.audioContent?.length || 0);

    return new Response(
      JSON.stringify({
        audioContent: ttsData.audioContent,
        audioEncoding: "MP3",
        characterCount: text.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[TTS] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
