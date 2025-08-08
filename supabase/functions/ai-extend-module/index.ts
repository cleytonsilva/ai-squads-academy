import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenAI error:", text);
      return new Response(JSON.stringify({ error: "OpenAI request failed", details: text }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const extendedHtml = data?.choices?.[0]?.message?.content?.trim?.() ?? "";

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
