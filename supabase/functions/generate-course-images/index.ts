import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ModuleRow = { id: string; title: string; order_index: number; content_jsonb: any | null };

type Course = { id: string; title: string; description: string | null; thumbnail_url: string | null };

async function generateImageWithCorcel(prompt: string, apiKey: string): Promise<string> {
  // NOTE: Endpoint and payload derived from Corcel docs. Adjust if needed.
  const resp = await fetch("https://api.corcel.io/v1/image/generate", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      // Suggest realistic, tech/cybersecurity style
      style: "realistic",
      guidance: 7.0,
      steps: 28,
      width: 1024,
      height: 576,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Corcel error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  // Try common shapes: {imageUrl} or {data: { url }} or { images: [{url}] }
  const url = data?.imageUrl || data?.data?.url || data?.images?.[0]?.url || data?.output?.[0] || data?.url;
  if (!url || typeof url !== "string") throw new Error("Resposta da Corcel sem URL de imagem");
  return url;
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
  if (!b64) throw new Error("OpenAI response without image");
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
  const cand = data?.candidates?.[0]?.content?.parts?.find?.((p: any) => p?.inline_data?.data);
  if (cand?.inline_data?.data) {
    const mime = cand?.inline_data?.mime_type || "image/png";
    return `data:${mime};base64,${cand.inline_data.data}`;
  }
  throw new Error("Gemini response without image");
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
      service.from("courses").select("id,title,description,thumbnail_url").eq("id", courseId).maybeSingle(),
      service.from("modules").select("id,title,order_index,content_jsonb").eq("course_id", courseId).order("order_index", { ascending: true }),
    ]);
    if (cErr) throw cErr;
    if (mErr) throw mErr;
    if (!course) return new Response(JSON.stringify({ error: "Course not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!CORCEL_API_KEY) {
      // If key is missing, return requirement so UI can prompt
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

    // Generate images (sequential to avoid rate limits) with fallback
    let courseImageUrl: string | null = null;
    try {
      courseImageUrl = await generateImageWithGemini(coursePrompt, 1536, 1024);
    } catch (err) {
      console.warn("Gemini course image failed, falling back to OpenAI:", err?.toString?.());
      try {
        courseImageUrl = await generateImageWithOpenAI(coursePrompt, "1536x1024");
      } catch (e2) {
        console.error("OpenAI fallback failed for course image:", e2);
      }
    }

    const moduleResults: Record<string, string> = {};
    for (const mp of modulePrompts) {
      try {
        const url = await generateImageWithGemini(mp.prompt, 1536, 1024);
        moduleResults[mp.id] = url;
      } catch (e) {
        console.warn("Gemini module image failed, falling back to OpenAI", mp.id, e?.toString?.());
        try {
          const url2 = await generateImageWithOpenAI(mp.prompt, "1536x1024");
          moduleResults[mp.id] = url2;
        } catch (e2) {
          console.error("Module image fallback failed", mp.id, e2);
        }
      }
    }

    // Persist: course thumbnail
    await service.from("courses").update({ thumbnail_url: courseImageUrl }).eq("id", courseId);

    // Persist: prepend image tag at top of module HTML
    const toUpdates: { id: string; content_jsonb: any }[] = [];
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
  } catch (e: any) {
    console.error("generate-course-images error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
