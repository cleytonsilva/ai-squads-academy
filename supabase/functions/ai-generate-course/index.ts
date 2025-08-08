import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers
const safeJsonParse = (text: string): any => {
  try {
    // Try direct parse
    return JSON.parse(text);
  } catch (_) {
    // Try to extract from ```json ... ``` block
    const match = text.match(/```json\n([\s\S]*?)\n```/i);
    if (match) {
      try { return JSON.parse(match[1]); } catch (_) {}
    }
    // Last resort: remove trailing commas
    try {
      const cleaned = text.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse JSON from model:", e);
      return null;
    }
  }
};

// OpenRouter helper to call models with fallback
async function callOpenRouter(messages: any[], models: string[], temperature: number = 0.6): Promise<string> {
  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  const APP_URL = "https://esquads.dev";
  const APP_TITLE = "Esquads Platform";
  if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
  let lastErr: any = null;
  for (const model of models) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": APP_URL,
          "X-Title": APP_TITLE,
        },
        body: JSON.stringify({ model, messages, temperature }),
      });
      const data = await r.json();
      if (!r.ok) { lastErr = data; continue; }
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (e) { lastErr = e; }
  }
  throw new Error(`OpenRouter failed: ${lastErr?.error?.message || lastErr?.message || "Unknown"}`);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

  if (!OPENROUTER_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return new Response(JSON.stringify({ error: "Missing server configuration/secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const input = await req.json().catch(() => ({}));
    const {
      topic,
      title,
      difficulty = "beginner",
      num_modules = 12,
      audience = "estudantes e profissionais de TI no Brasil",
      include_final_exam = true,
      final_exam_difficulty,
      final_exam_options = 4,
      final_exam_questions = 20,
      description,
      tone = "profissional",
      target_audience = [],
      module_length_min = 2200,
      module_length_max = 3200,
    } = input || {};

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve current user and profile id
    const { data: authData } = await anonClient.auth.getUser();
    const authUserId = authData?.user?.id || null;
    let profileId: string | null = null;
    if (authUserId) {
      const { data: prof } = await serviceClient
        .from("profiles")
        .select("id")
        .eq("user_id", authUserId)
        .maybeSingle();
      profileId = prof?.id || null;
    }

    // Create a generation job row
    const { data: jobRow, error: jobErr } = await serviceClient
      .from("generation_jobs")
      .insert({
        type: "ai_generate_course",
        status: "queued",
        input: { topic, title, difficulty, num_modules, audience, include_final_exam, final_exam_difficulty, final_exam_options, final_exam_questions },
        created_by: profileId,
      })
      .select("id")
      .single();

    if (jobErr) {
      console.error("Failed to create job:", jobErr);
      return new Response(JSON.stringify({ error: "Falha ao iniciar geração" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobId = jobRow.id as string;

    const backgroundTask = async () => {
      const updateJob = async (patch: Record<string, unknown>) => {
        await serviceClient.from("generation_jobs").update(patch).eq("id", jobId);
      };

      try {
        console.log("[AI-GEN] Processing job", jobId);
        await updateJob({ status: "processing" });

        const promptTitle = title || (topic ? `Curso: ${topic}` : "Curso de Cibersegurança");

        const system = `Você é um gerador de cursos da plataforma Esquads. Gere JSON válido e conciso.\nRegras:\n- Domínio: Cibersegurança/TI/Negócios\n- Idioma: pt-BR\n- Estrutura: {\n  "title": string,\n  "description": string,\n  "estimated_minutes": number,\n  "modules": [\n    { "title": string, "summary": string, "content_html": string, "quiz": {\n        "title": string, "description": string,\n        "questions": [ {"q": string, "options": [string,string,string,string], "answer": number, "explanation": string } ]\n      }\n    }\n  ]\n}\n- Mínimo: 8 módulos, Máximo: ${Math.max(8, Math.min(20, Number(num_modules) || 12))}.`;

        const userMsg = `Gere um curso completo para o público: ${audience}.\nTítulo sugerido: ${promptTitle}\nNível: ${difficulty}.\nCada módulo com resumo, conteúdo em HTML curto (2-4 parágrafos com <p>), e um quiz de 5 questões de múltipla escolha.`;

        const models = [
          "qwen/qwen2.5-vl-72b-instruct:free",
          "openai/gpt-oss-20b:free",
          "z-ai/glm-4.5-air:free",
          "deepseek/deepseek-r1-0528-qwen3-8b:free",
        ];

        const contentText = await callOpenRouter(
          [
            { role: "system", content: system },
            { role: "user", content: userMsg },
          ],
          models,
          0.6,
        );
        const parsed = safeJsonParse(contentText);
        if (!parsed || !parsed.modules || !Array.isArray(parsed.modules)) {
          throw new Error("Resposta da IA inválida (sem módulos)");
        }

        const estimated_minutes = Number(parsed.estimated_minutes || parsed.modules.length * 15);

        // Create course (draft)
        const { data: courseRow, error: courseErr } = await serviceClient
          .from("courses")
          .insert({
            title: parsed.title || promptTitle,
            description: parsed.description || `Curso gerado por IA: ${promptTitle}`,
            ai_generated: true,
            is_published: false,
            status: "draft",
            difficulty_level: difficulty,
            estimated_duration: estimated_minutes,
          })
          .select("id")
          .single();

        if (courseErr || !courseRow?.id) {
          console.error("DB error creating course", courseErr);
          throw new Error("Falha ao criar curso no banco de dados");
        }

        const courseId = courseRow.id as string;

        // Insert modules and quizzes
        for (let i = 0; i < parsed.modules.length; i++) {
          const m = parsed.modules[i];
          const modPayload = {
            course_id: courseId,
            title: m.title || `Módulo ${i + 1}`,
            order_index: i,
            content_jsonb: {
              html: m.content_html || "",
              summary: m.summary || "",
            },
          } as Record<string, unknown>;

          const { data: modRow, error: modErr } = await serviceClient
            .from("modules")
            .insert(modPayload)
            .select("id")
            .single();

          if (modErr || !modRow?.id) {
            console.error("DB error creating module", modErr);
            throw new Error("Falha ao criar módulo");
          }

          const moduleId = modRow.id as string;

          if (m.quiz && Array.isArray(m.quiz?.questions) && m.quiz.questions.length > 0) {
            const quizTitle = m.quiz.title || `Quiz do módulo ${i + 1}`;
            const quizDescription = m.quiz.description || "Avalie seus conhecimentos";

            const { error: quizErr } = await serviceClient
              .from("quizzes")
              .insert({
                course_id: courseId,
                module_id: moduleId,
                title: quizTitle,
                description: quizDescription,
                questions: m.quiz.questions,
              });

            if (quizErr) {
              console.error("DB error creating quiz", quizErr);
              throw new Error("Falha ao criar quiz");
            }
          }
        }

        // Final exam generation (optional)
        if (include_final_exam) {
          try {
            const fed = (typeof final_exam_difficulty === "string" && final_exam_difficulty) ? final_exam_difficulty : difficulty;
            const optCount = Math.max(2, Math.min(6, Number(final_exam_options) || 4));
            const qCount = Math.max(5, Math.min(50, Number(final_exam_questions) || 20));

            const system2 = `Gere apenas JSON válido para uma prova final. Estrutura: { "questions": [ { "question": string, "options": string[], "correct_answer": string, "explanation": string } ] }`;
            const topics = Array.isArray(parsed.modules) ? parsed.modules.map((m: any) => m.title).join("; ") : "";
            const user2 = `Crie ${qCount} questões de múltipla escolha (nível: ${fed}) para a prova final do curso "${parsed.title || promptTitle}".\n- Cada questão deve ter ${optCount} opções.\n- Evite respostas ambíguas.\n- Inclua explicação curta.\n- Use pt-BR.\n- Foco nos tópicos: ${topics}`;

            const contentText2 = await callOpenRouter(
              [ { role: "system", content: system2 }, { role: "user", content: user2 } ],
              [
                "qwen/qwen2.5-vl-72b-instruct:free",
                "openai/gpt-oss-20b:free",
                "z-ai/glm-4.5-air:free",
                "deepseek/deepseek-r1-0528-qwen3-8b:free",
              ],
              0.4,
            );
            const parsed2 = safeJsonParse(contentText2) || { questions: [] };
            const questions = Array.isArray(parsed2.questions) ? parsed2.questions : [];

            // Create final exam module
            const { data: finalMod, error: fModErr } = await serviceClient
              .from("modules")
              .insert({
                course_id: courseId,
                title: "Prova Final",
                order_index: parsed.modules.length,
                module_type: "final_exam",
                content_jsonb: { html: `<h2>Prova Final</h2><p>Responda às questões a seguir para concluir o curso.</p>` },
              })
              .select("id")
              .single();
            if (fModErr || !finalMod?.id) throw new Error("Falha ao criar módulo de prova final");

            // Insert final exam quiz
            const qNormalized = questions.map((q: any) => ({
              question: String(q.question || q.q || "Pergunta"),
              options: Array.isArray(q.options) ? q.options.slice(0, optCount).map((o: any) => String(o)) : [],
              correct_answer: typeof q.correct_answer === "string" ? q.correct_answer : (Array.isArray(q.options) ? String(q.options[0]) : ""),
              explanation: q.explanation ? String(q.explanation) : "",
              type: "multiple_choice",
            }));

            const { error: fQuizErr } = await serviceClient
              .from("quizzes")
              .insert({
                course_id: courseId,
                module_id: finalMod.id,
                title: "Prova final do curso",
                description: `Nível: ${fed}. Você precisa atingir a nota de corte definida pelo curso para obter o certificado.`,
                questions: qNormalized,
              });
            if (fQuizErr) throw fQuizErr;
          } catch (e) {
            console.error("[AI-GEN] Final exam generation failed:", e);
            // Continue without failing the whole job
          }
        }

        await updateJob({ status: "completed", output: { course_id: courseId } });
        console.log("[AI-GEN] Job completed", jobId, courseId);
      } catch (err: any) {
        console.error("[AI-GEN] Job failed", jobId, err?.message || err);
        await (async () => {
          try { await serviceClient.from("generation_jobs").update({ status: "failed", error: String(err?.message || err) }).eq("id", jobId); } catch {}
        })();
      }
    };

    const w = (globalThis as any).EdgeRuntime?.waitUntil;
    if (typeof w === "function") {
      w(backgroundTask());
    } else {
      // Fallback: fire-and-forget
      backgroundTask();
    }

    return new Response(JSON.stringify({ job_id: jobId, message: "Geração iniciada" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[AI-GEN] Handler error:", error?.message || error);
    return new Response(JSON.stringify({ error: error?.message || "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
