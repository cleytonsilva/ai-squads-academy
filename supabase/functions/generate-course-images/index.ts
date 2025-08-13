/// <reference types="https://deno.land/x/deno@v1.28.2/lib/deno.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type JsonContent = Record<string, unknown> | null;
type ModuleRow = { id: string; title: string; order_index: number; content_jsonb: JsonContent };

type Course = { 
  id: string; 
  title: string; 
  description: string | null; 
  cover_image_url: string | null;
  thumbnail_url: string | null; // Campo legado para compatibilidade
};

async function generateImageWithCorcel(
  prompt: string,
  apiKey: string,
  engine: string = "proteus",
  width: number = 1024,
  height: number = 576,
  steps: number = 8,
  cfgScale: number = 2
): Promise<string> {
  // Enforce Corcel limits: multiples of 64, between 512-1344
  const clampDim = (v: number) => Math.max(512, Math.min(1344, Math.floor(v / 64) * 64));
  const W = String(clampDim(width));
  const H = String(clampDim(height));

  const resp = await fetch("https://api.corcel.io/v1/image/vision/text-to-image", {
    method: "POST",
    headers: {
      // Corcel expects the raw API key in Authorization (no Bearer prefix)
      "Authorization": apiKey,
      "Content-Type": "application/json",
      "accept": "application/json",
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt, weight: 1 }],
      cfg_scale: cfgScale,
      height: H,
      width: W,
      steps,
      engine,
    }),
  });
  if (!resp.ok) {
    let text = await resp.text();
    try {
      const j = JSON.parse(text);
      text = JSON.stringify(j);
    } catch {
      // Parse error - keep original text
    }
    throw new Error(`Corcel error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  // Corcel response format: { signed_urls: ["https://..."] }
  const url = data?.signed_urls?.[0] || data?.imageUrl || data?.data?.url || data?.images?.[0]?.url || data?.output?.[0] || data?.url;
  const b64 = data?.artifacts?.[0]?.base64 || data?.images?.[0]?.base64;
  if (url && typeof url === "string") return url;
  if (b64 && typeof b64 === "string") return `data:image/png;base64,${b64}`;
  throw new Error("Resposta da Corcel sem imagem (url/base64)");
}

async function generateImageWithOpenAI(prompt: string, size: string = "1536x1024"): Promise<string> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY for fallback");
  const resp = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI image error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const b64 = data?.data?.[0]?.b64_json;
  const url = data?.data?.[0]?.url;
  if (url && typeof url === "string") return url;
  if (!b4) throw new Error("OpenAI response without image");
  return `data:image/png;base64,${b64}`;
}


async function generateImageWithGemini(prompt: string, width: number = 1536, height: number = 1024): Promise<string> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY for image generation");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0:generateImages?key=${GEMINI_API_KEY}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: { text: prompt },
      imageGenerationConfig: { numberOfImages: 1, width, height }
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini image error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  // Response compatibility parsing
  const img1 = data?.images?.[0];
  if (img1?.content) {
    const mime = img1?.mimeType || "image/png";
    return `data:${mime};base64,${img1.content}`;
  }
  const img2 = data?.generatedImages?.[0];
  if (img2?.image?.bytesBase64Encoded) {
    const mime = img2?.mimeType || "image/png";
    return `data:${mime};base64,${img2.image.bytesBase64Encoded}`;
  }
  const cand = data?.candidates?.[0]?.content?.parts?.find?.((p: JsonContent) => p?.inline_data?.data);
  if (cand?.inline_data?.data) {
    const mime = cand?.inline_data?.mime_type || "image/png";
    return `data:${mime};base64,${cand.inline_data.data}`;
  }
  throw new Error("Gemini response without image");
}

async function generateImageWithReplicate(
  prompt: string,
  aspectRatio: string = "16:9",
  outputFormat: string = "webp",
  outputQuality: number = 80,
  safetyTolerance: number = 2,
  promptUpsampling: boolean = true
): Promise<string> {
  const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
  if (!REPLICATE_API_TOKEN) throw new Error("Missing REPLICATE_API_TOKEN for image generation");

  // Debug: Log token info (sem expor o token completo)
  console.log(`[DEBUG] Token exists: ${!!REPLICATE_API_TOKEN}`);
  console.log(`[DEBUG] Token length: ${REPLICATE_API_TOKEN?.length || 0}`);
  console.log(`[DEBUG] Token starts with r8_: ${REPLICATE_API_TOKEN?.startsWith('r8_') || false}`);

  const requestBody = {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: outputFormat,
      output_quality: outputQuality,
      safety_tolerance: safetyTolerance,
      prompt_upsampling: promptUpsampling,
    },
  };

  console.log(`[DEBUG] Request body:`, JSON.stringify(requestBody, null, 2));

  const resp = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-1.1-pro/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`[DEBUG] Response status: ${resp.status}`);
  console.log(`[DEBUG] Response headers:`, Object.fromEntries(resp.headers.entries()));

  if (!resp.ok) {
    const text = await resp.text();
    console.error(`[DEBUG] Error response body:`, text);
    throw new Error(`Replicate API error ${resp.status}: ${text}`);
  }

  const prediction = await resp.json();
  const predictionId = prediction.id;

  // Poll for completion
  let result;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes timeout

  while (attempts < maxAttempts) {
    const statusResp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!statusResp.ok) {
      throw new Error(`Failed to check prediction status: ${statusResp.status}`);
    }

    result = await statusResp.json();

    if (result.status === "succeeded") {
      break;
    } else if (result.status === "failed") {
      throw new Error(`Replicate prediction failed: ${result.error || "Unknown error"}`);
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Replicate prediction timed out");
  }

  const imageUrl = result.output;
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Replicate response without valid image URL");
  }

  return imageUrl;
}

async function generateImageWithIdeogram(
  prompt: string,
  aspectRatio: string = "16:9",
  resolution: string = "None",
  styleType: string = "None",
  magicPromptOption: string = "Auto"
): Promise<string> {
  const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
  if (!REPLICATE_API_TOKEN) throw new Error("Missing REPLICATE_API_TOKEN for image generation");

  const resp = await fetch("https://api.replicate.com/v1/models/ideogram-ai/ideogram-v3-turbo/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        style_type: styleType,
        magic_prompt_option: magicPromptOption,
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Replicate API error ${resp.status}: ${text}`);
  }

  const prediction = await resp.json();
  const predictionId = prediction.id;

  // Poll for completion
  let result;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes timeout

  while (attempts < maxAttempts) {
    const statusResp = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: {
        "Authorization": `Bearer ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!statusResp.ok) {
      throw new Error(`Failed to check prediction status: ${statusResp.status}`);
    }

    result = await statusResp.json();

    if (result.status === "succeeded") {
      break;
    } else if (result.status === "failed") {
      throw new Error(`Ideogram prediction failed: ${result.error || "Unknown error"}`);
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Ideogram prediction timed out");
  }

  if (!result || !result.output) {
    throw new Error("Ideogram response without image URL");
  }

  return result.output;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const CORCEL_API_KEY = Deno.env.get("CORCEL_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Supabase env not set" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const courseId: string | undefined = body?.courseId || body?.course_id;
    const requestedEngineRaw: string | undefined = body?.engine || body?.imageEngine || body?.corcel_engine;
    const imageProvider = (() => {
      const v = String(requestedEngineRaw || '').toLowerCase();
      if (v.includes('replicate') || v.includes('flux-1.1-pro')) return 'replicate';
      if (v.includes('ideogram') || v.includes('v3-turbo')) return 'ideogram';
      if (v.includes('openai') || v.includes('dall-e')) return 'openai';
      if (v.includes('gemini') || v.includes('imagen')) return 'gemini';
      return 'corcel'; // default
    })();
    const engine = (() => {
      const v = String(requestedEngineRaw || '').toLowerCase();
      if (v.includes('flux')) return 'flux-schnell';
      if (v.includes('dream')) return 'dreamshaper';
      if (v.includes('proteus')) return 'proteus';
      return 'proteus';
    })();
    if (!courseId) {
      return new Response(JSON.stringify({ error: "Missing courseId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auth: must be logged in and admin
    const { data: { user } } = await anon.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { data: profile } = await anon.from("profiles").select("id,role").eq("user_id", user.id).maybeSingle();
    if (!profile || !["admin", "instructor"].includes(String(profile.role))) {
      return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load course + modules
    const [{ data: course, error: cErr }, { data: modules, error: mErr }] = await Promise.all([
      service.from("courses").select("id,title,description,cover_image_url,thumbnail_url").eq("id", courseId).maybeSingle(),
      service.from("modules").select("id,title,order_index,content_jsonb").eq("course_id", courseId).order("order_index", { ascending: true }),
    ]);
    if (cErr) throw cErr;
    if (mErr) throw mErr;
    if (!course) return new Response(JSON.stringify({ error: "Course not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Verificar se a chave necessária está disponível
    if (imageProvider === 'corcel' && !CORCEL_API_KEY) {
      return new Response(JSON.stringify({
        error: "Missing CORCEL_API_KEY",
        requiresSecret: true,
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build prompts
    const coursePrompt = `Capa realista em alta qualidade para curso de tecnologia e cibersegurança, tema: ${course.title}. Estilo moderno, profissional, clean UI, cores tecnológicas, elementos de rede, cadeados, circuitos, data streams. Sem texto, sem logotipos. Aspect ratio 16:9.`;

    const modulePrompts = (modules as ModuleRow[]).map((m) => ({
      id: m.id,
      prompt: `Imagem realista relacionada a tecnologia e cibersegurança para capítulo: ${m.title}. Visual profissional, foco no tema, sem texto. Aspect ratio 16:9.`,
    }));

    // Função auxiliar para gerar imagem baseada no provider
    async function generateImage(prompt: string): Promise<string> {
      switch (imageProvider) {
        case 'replicate':
          return await generateImageWithReplicate(prompt, "16:9", "webp", 80, 2, true);
        case 'ideogram':
          return await generateImageWithIdeogram(prompt, "16:9", "None", "None", "Auto");
        case 'openai':
          return await generateImageWithOpenAI(prompt, "1024x576");
        case 'gemini':
          return await generateImageWithGemini(prompt, 1024, 576);
        case 'corcel':
        default:
          return await generateImageWithCorcel(prompt, CORCEL_API_KEY!, engine, 1024, 576, 8, 2);
      }
    }

    // Generate images (sequential to avoid rate limits)
    let courseImageUrl: string | null = null;
    try {
      courseImageUrl = await generateImage(coursePrompt);
    } catch (err) {
      console.error(`${imageProvider} course image failed:`, err?.toString?.());
    }

    const moduleResults: Record<string, string> = {};
    for (const mp of modulePrompts) {
      try {
        const url = await generateImage(mp.prompt);
        moduleResults[mp.id] = url;
      } catch (e) {
        console.error(`${imageProvider} module image failed`, mp.id, e?.toString?.());
      }
    }

    // Persist: course cover image (dual write: cover_image_url + thumbnail_url legacy)
    if (courseImageUrl) {
      await service.from("courses").update({ cover_image_url: courseImageUrl, thumbnail_url: courseImageUrl }).eq("id", courseId);
    }

    // Persist: prepend image tag at top of module HTML
    const toUpdates: { id: string; content_jsonb: JsonContent }[] = [];
    (modules as ModuleRow[]).forEach((m) => {
      const url = moduleResults[m.id];
      if (!url) return;
      const html = (m.content_jsonb?.html as string | undefined) || "";
      const imgHtml = `<figure><img src="${url}" alt="Imagem do capítulo ${m.title} - cibersegurança e tecnologia" style="width:100%;height:auto;border-radius:12px;"/></figure>`;
      const newHtml = html?.trim() ? `${imgHtml}\n${html}` : imgHtml;
      toUpdates.push({ id: m.id, content_jsonb: { ...(m.content_jsonb || {}), html: newHtml } });
    });

    // Batch updates (chunked)
    for (let i = 0; i < toUpdates.length; i += 50) {
      const chunk = toUpdates.slice(i, i + 50);
      await service.from("modules").upsert(chunk);
    }

    return new Response(JSON.stringify({
      courseImageUrl,
      moduleImages: moduleResults,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: unknown) {
    console.error("generate-course-images error", e);
    const errorMessage = e instanceof Error ? e.message : "Unexpected error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
