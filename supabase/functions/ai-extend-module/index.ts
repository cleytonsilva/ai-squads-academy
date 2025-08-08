import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");

const APP_URL = "https://esquads.dev";
const APP_TITLE = "Esquads Platform";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing OPENROUTER_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { html, moduleTitle, prompt, length = "medium", tone = "neutral", language = "pt-BR" } = await req.json();

    const lengthMap: Record<string, string> = {
      short: "1-2 parágrafos",
      medium: "3-5 parágrafos",
      long: "6-8 parágrafos com exemplos",
    };

    const body = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `Você é um assistente de educação que melhora conteúdos de módulos. Responda apenas com HTML válido (sem <html> ou <body>), mantendo o estilo e a estrutura do conteúdo existente. Escreva em ${language}.` ,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Título do módulo: ${moduleTitle || "(sem título)"}` },
            { type: "text", text: `Tom desejado: ${tone}` },
            { type: "text", text: `Extensão desejada: ${lengthMap[length] || lengthMap.medium}` },
            { type: "text", text: `Instruções adicionais: ${prompt || ""}` },
            { type: "text", text: "Conteúdo atual (HTML):" },
            { type: "text", text: html || "" },
            { type: "text", text: "Por favor, gere APENAS o novo conteúdo em HTML para ser anexado ao final. Não repita o conteúdo original." },
          ],
        },
      ],
      temperature: 0.7,
    };

    const models = [
      "qwen/qwen2.5-vl-72b-instruct:free",
      "openai/gpt-oss-20b:free",
      "z-ai/glm-4.5-air:free",
      "deepseek/deepseek-r1-0528-qwen3-8b:free",
    ];

    let extendedHtml = "";
    let lastErr: any = null;
    for (const model of models) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": APP_URL,
            "X-Title": APP_TITLE,
          },
          body: JSON.stringify({ model, ...body }),
        });
        const data = await response.json();
        if (!response.ok) {
          lastErr = data;
          continue;
        }
        extendedHtml = data?.choices?.[0]?.message?.content?.trim?.() ?? "";
        if (extendedHtml) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!extendedHtml) {
      console.error("OpenRouter error:", lastErr);
      return new Response(JSON.stringify({ error: "All OpenRouter models failed", details: String(lastErr?.error?.message || lastErr?.message || lastErr) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ extendedHtml }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("ai-extend-module error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
