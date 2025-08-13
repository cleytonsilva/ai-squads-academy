import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, replicate-signature",
};

/**
 * Verifica a assinatura do webhook do Replicate
 * @param body - Corpo da requisição como string
 * @param signature - Assinatura do cabeçalho Replicate-Signature
 * @param secret - Segredo do webhook
 * @returns boolean indicando se a assinatura é válida
 */
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Remove o prefixo "sha256=" da assinatura
    const expectedSignature = signature.replace("sha256=", "");
    
    // Cria a chave HMAC
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Calcula a assinatura
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    
    // Converte para hex
    const calculatedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    // Compara as assinaturas de forma segura
    return calculatedSignature === expectedSignature;
  } catch (error) {
    console.error("Erro ao verificar assinatura do webhook:", error);
    return false;
  }
}

/**
 * Processa o webhook do Replicate
 * @param webhookData - Dados do webhook
 */
async function processReplicateWebhook(webhookData: any, supabase: any) {
  try {
    const { id, status, output, error, input } = webhookData;
    
    console.log(`[WEBHOOK] Processando predição ${id} com status: ${status}`);
    
    // Atualiza o status da predição no banco de dados
    const { error: updateError } = await supabase
      .from('replicate_predictions')
      .update({
        status,
        output: output || null,
        error: error || null,
        completed_at: status === 'succeeded' || status === 'failed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('prediction_id', id);
    
    if (updateError) {
      console.error(`[WEBHOOK] Erro ao atualizar predição ${id}:`, updateError);
      return;
    }
    
    // Se a predição foi bem-sucedida e é uma geração de imagem de curso
    if (status === 'succeeded' && output) {
      // Busca informações da predição
      const { data: prediction } = await supabase
        .from('replicate_predictions')
        .select('course_id, module_id, prediction_type')
        .eq('prediction_id', id)
        .single();
      
      if (prediction) {
        // Se é uma capa de curso
        if (prediction.prediction_type === 'course_cover' && prediction.course_id) {
          // Implementa escrita dupla: cover_image_url (principal) + thumbnail_url (legado)
          const { error: courseUpdateError } = await supabase
            .from('courses')
            .update({ 
              cover_image_url: output,  // Campo principal
              thumbnail_url: output     // Campo legado para compatibilidade
            })
            .eq('id', prediction.course_id);
          
          if (courseUpdateError) {
            console.error(`[WEBHOOK] Erro ao atualizar capa do curso ${prediction.course_id}:`, courseUpdateError);
          } else {
            console.log(`[WEBHOOK] Capa do curso ${prediction.course_id} atualizada com sucesso`);
          }
        }
        
        // Se é uma imagem de módulo
        if (prediction.prediction_type === 'module_image' && prediction.module_id) {
          // Busca o conteúdo atual do módulo
          const { data: module } = await supabase
            .from('modules')
            .select('content_jsonb')
            .eq('id', prediction.module_id)
            .single();
          
          if (module && module.content_jsonb) {
            // Adiciona a imagem no início do conteúdo HTML
            const imageHtml = `<img src="${output}" alt="Imagem do módulo" style="width: 100%; max-width: 800px; height: auto; margin-bottom: 20px; border-radius: 8px;" />`;
            
            let updatedContent = module.content_jsonb;
            if (typeof updatedContent === 'string') {
              updatedContent = imageHtml + updatedContent;
            } else if (updatedContent.html) {
              updatedContent.html = imageHtml + updatedContent.html;
            }
            
            const { error: moduleUpdateError } = await supabase
              .from('modules')
              .update({ content_jsonb: updatedContent })
              .eq('id', prediction.module_id);
            
            if (moduleUpdateError) {
              console.error(`[WEBHOOK] Erro ao atualizar módulo ${prediction.module_id}:`, moduleUpdateError);
            } else {
              console.log(`[WEBHOOK] Imagem do módulo ${prediction.module_id} adicionada com sucesso`);
            }
          }
        }
      }
    }
    
    // Se a predição falhou, registra o erro
    if (status === 'failed') {
      console.error(`[WEBHOOK] Predição ${id} falhou:`, error);
    }
    
  } catch (err) {
    console.error(`[WEBHOOK] Erro ao processar webhook:`, err);
  }
}

serve(async (req) => {
  // Permite requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Apenas aceita requisições POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  try {
    // Configurações do Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const REPLICATE_WEBHOOK_SECRET = Deno.env.get("REPLICATE_WEBHOOK_SECRET");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Configurações do Supabase não encontradas");
    }
    
    if (!REPLICATE_WEBHOOK_SECRET) {
      throw new Error("REPLICATE_WEBHOOK_SECRET não configurado");
    }
    
    // Lê o corpo da requisição
    const body = await req.text();
    
    // Verifica a assinatura do webhook
    const signature = req.headers.get("replicate-signature");
    if (!signature) {
      console.error("[WEBHOOK] Assinatura do webhook não encontrada");
      return new Response(JSON.stringify({ error: "Assinatura não encontrada" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const isValidSignature = await verifyWebhookSignature(
      body,
      signature,
      REPLICATE_WEBHOOK_SECRET
    );
    
    if (!isValidSignature) {
      console.error("[WEBHOOK] Assinatura do webhook inválida");
      return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Parse do JSON
    const webhookData = JSON.parse(body);
    
    // Cria cliente do Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Processa o webhook
    await processReplicateWebhook(webhookData, supabase);
    
    console.log(`[WEBHOOK] Webhook processado com sucesso para predição ${webhookData.id}`);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("[WEBHOOK] Erro no processamento:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});