/// <reference types="https://deno.land/x/deno@v1.28.2/lib/deno.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { downloadAndUploadImage, isValidImageUrl } from "../shared/image-storage-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, replicate-signature, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Interfaces para tipagem
interface WebhookPayload {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  logs?: string;
  metrics?: {
    predict_time?: number;
    total_time?: number;
  };
  input: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

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
 * Processamento do webhook com retry automático e logging melhorado
 * @param payload - Dados do webhook
 * @param supabase - Cliente Supabase
 * @param maxRetries - Número máximo de tentativas
 */
async function processWebhookWithRetry(
  payload: WebhookPayload,
  supabase: any,
  maxRetries = 5
): Promise<void> {
  let attempt = 0;
  let lastError: any = null;
  
  while (attempt < maxRetries) {
    try {
      console.log(`[WEBHOOK] Tentativa ${attempt + 1}/${maxRetries} para predição ${payload.id}`);
      await processWebhook(payload, supabase);
      
      // Log de sucesso
      console.log(`[WEBHOOK] Processamento bem-sucedido na tentativa ${attempt + 1}`);
      return; // Sucesso
    } catch (error: any) {
      attempt++;
      lastError = error;
      console.error(`[WEBHOOK] Tentativa ${attempt} falhou para ${payload.id}:`, {
        error: error.message,
        stack: error.stack,
        payload: {
          id: payload.id,
          status: payload.status,
          hasOutput: !!payload.output
        }
      });
      
      if (attempt >= maxRetries) {
        // Log final de erro
        console.error(`[WEBHOOK] Todas as ${maxRetries} tentativas falharam para ${payload.id}`);
        
        // Registrar falha crítica
        try {
          await supabase
            .from('generation_events')
            .insert({
              event_type: 'webhook_failed',
              event_data: {
                prediction_id: payload.id,
                error: error.message,
                attempts: maxRetries,
                timestamp: new Date().toISOString()
              },
              created_at: new Date().toISOString()
            });
        } catch (logError) {
          console.error('[WEBHOOK] Erro ao registrar falha:', logError);
        }
        
        throw lastError;
      }
      
      // Backoff exponencial com jitter
      const baseDelay = Math.pow(2, attempt) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;
      
      console.log(`[WEBHOOK] Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Processa o webhook do Replicate
 * @param payload - Dados do webhook
 * @param supabase - Cliente Supabase
 */
async function processWebhook(payload: WebhookPayload, supabase: any): Promise<void> {
  const { id, status, output, error, logs, metrics } = payload;
  
  console.log(`[WEBHOOK] Processando predição ${id} - Status: ${status}`);
  
  // Buscar registro da predição
  const { data: prediction, error: fetchError } = await supabase
    .from('replicate_predictions')
    .select('*')
    .eq('prediction_id', id)
    .single();
    
  if (fetchError || !prediction) {
    console.error(`[WEBHOOK] Predição ${id} não encontrada:`, fetchError);
    return;
  }
  
  // Preparar dados de atualização
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
    logs: logs || prediction.logs
  };
  
  if (status === 'succeeded' && output) {
    updateData.output = Array.isArray(output) ? output[0] : output;
    updateData.completed_at = new Date().toISOString();
    
    // Calcular métricas de performance
    if (metrics) {
      updateData.metrics = {
        predict_time: metrics.predict_time,
        total_time: metrics.total_time,
        processed_at: new Date().toISOString()
      };
    }
  } else if (status === 'failed') {
    updateData.error = error || 'Erro desconhecido';
    updateData.completed_at = new Date().toISOString();
  }
  
  // Atualizar status da predição
  const { error: updateError } = await supabase
    .from('replicate_predictions')
    .update(updateData)
    .eq('prediction_id', id);
    
  if (updateError) {
    throw new Error(`Erro ao atualizar predição: ${updateError.message}`);
  }
    
  // Processar resultado se bem-sucedido
  if (status === 'succeeded' && output) {
    await processSuccessfulGeneration(prediction, updateData.output, supabase);
  }
  
  // Atualizar job principal
  await updateGenerationJobStatus(prediction, status, supabase);
  
  // Registrar evento
  await logGenerationEvent({
    type: status === 'succeeded' ? 'prediction_completed' : 'prediction_failed',
    prediction_id: id,
    prediction_type: prediction.prediction_type,
    course_id: prediction.course_id,
    module_id: prediction.module_id,
    status,
    error: status === 'failed' ? error : null,
    timestamp: new Date().toISOString()
  }, supabase);
}

/**
 * Invalida cache e notifica atualização
 * @param supabase - Cliente Supabase
 * @param courseId - ID do curso
 * @param imageUrl - Nova URL da imagem
 */
async function invalidateCacheAndNotify(
  supabase: any,
  courseId: string,
  imageUrl: string
): Promise<void> {
  try {
    // Registrar evento de cache invalidation
    await supabase
      .from('generation_events')
      .insert({
        event_type: 'cache_invalidated',
        event_data: {
          course_id: courseId,
          new_image_url: imageUrl,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

    // Notificar frontend via realtime
    await supabase
      .channel('course_updates')
      .send({
        type: 'broadcast',
        event: 'cover_updated',
        payload: {
          course_id: courseId,
          cover_image_url: imageUrl,
          timestamp: new Date().toISOString()
        }
      });

    console.log(`[WEBHOOK] Cache invalidado e frontend notificado para curso ${courseId}`);
  } catch (error) {
    console.error('[WEBHOOK] Erro ao invalidar cache:', error);
    // Não falhar o webhook por causa de notificação
  }
}

/**
 * Processa resultado bem-sucedido da geração
 * @param prediction - Dados da predição
 * @param imageUrl - URL da imagem gerada
 * @param supabase - Cliente Supabase
 */
async function processSuccessfulGeneration(
  prediction: any,
  imageUrl: string,
  supabase: any
): Promise<void> {
  const { prediction_type, course_id, module_id } = prediction;
  
  try {
    // Validar se a URL da imagem é válida
    if (!isValidImageUrl(imageUrl)) {
      throw new Error(`URL de imagem inválida: ${imageUrl}`);
    }

    console.log(`[WEBHOOK] Processando imagem: ${imageUrl}`);
    
    // Download e upload da imagem para Storage local
    const uploadResult = await downloadAndUploadImage(
      supabase,
      imageUrl,
      {
        courseId: course_id,
        moduleId: module_id,
        predictionId: prediction.prediction_id
      }
    );

    if (!uploadResult.success) {
      throw new Error(`Falha no upload da imagem: ${uploadResult.error}`);
    }

    const localImageUrl = uploadResult.publicUrl!;
    console.log(`[WEBHOOK] Imagem salva localmente: ${localImageUrl}`);
    
    if (prediction_type === 'course_cover' && course_id) {
      // Atualizar capa do curso com URL local
      const { error: updateError } = await supabase
        .from('courses')
        .update({
          cover_image_url: localImageUrl,
          thumbnail_url: localImageUrl, // Compatibilidade
          updated_at: new Date().toISOString()
        })
        .eq('id', course_id);

      if (updateError) {
        throw new Error(`Erro ao atualizar curso: ${updateError.message}`);
      }
        
      console.log(`[WEBHOOK] Capa do curso ${course_id} atualizada com URL local`);
      
      // Invalidar cache e notificar frontend
      await invalidateCacheAndNotify(supabase, course_id, localImageUrl);
      
    } else if (prediction_type === 'module_image' && module_id) {
      // Atualizar imagem do módulo com URL local
      const { data: module } = await supabase
        .from('modules')
        .select('content_jsonb, title')
        .eq('id', module_id)
        .single();
        
      if (module) {
        const imageHtml = createModuleImageHtml(localImageUrl, module.title);
        const updatedContent = prependImageToContent(module.content_jsonb, imageHtml);
        
        await supabase
          .from('modules')
          .update({
            content_jsonb: updatedContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', module_id);
          
        console.log(`[WEBHOOK] Imagem do módulo ${module_id} atualizada com URL local`);
      }
    }
    
  } catch (error) {
    console.error(`[WEBHOOK] Erro ao processar resultado:`, error);
    throw error;
  }
}

/**
 * Cria HTML otimizado para imagem do módulo
 * @param imageUrl - URL da imagem
 * @param moduleTitle - Título do módulo
 * @returns HTML da imagem
 */
function createModuleImageHtml(imageUrl: string, moduleTitle: string): string {
  return `
    <figure class="module-image" style="margin: 0 0 24px 0; text-align: center;">
      <img 
        src="${imageUrl}" 
        alt="Ilustração do módulo: ${moduleTitle}" 
        style="
          width: 100%; 
          max-width: 800px; 
          height: auto; 
          border-radius: 12px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s ease;
        "
        loading="lazy"
      />
      <figcaption style="
        margin-top: 8px; 
        font-size: 14px; 
        color: #666; 
        font-style: italic;
      ">
        Ilustração do módulo
      </figcaption>
    </figure>
  `;
}

/**
 * Adiciona imagem no início do conteúdo do módulo
 * @param content - Conteúdo atual do módulo
 * @param imageHtml - HTML da imagem
 * @returns Conteúdo atualizado
 */
function prependImageToContent(content: any, imageHtml: string): any {
  if (typeof content === 'string') {
    return imageHtml + content;
  } else if (content && content.html) {
    return {
      ...content,
      html: imageHtml + content.html
    };
  }
  return { html: imageHtml };
}

/**
 * Atualiza status do job principal
 * @param prediction - Dados da predição
 * @param status - Status atual
 * @param supabase - Cliente Supabase
 */
async function updateGenerationJobStatus(
  prediction: any,
  status: string,
  supabase: any
): Promise<void> {
  // Buscar job relacionado através da predição
  const { data: jobs } = await supabase
    .from('generation_jobs')
    .select('*')
    .eq('course_id', prediction.course_id)
    .eq('status', 'processing');
    
  if (jobs && jobs.length > 0) {
    const job = jobs[0];
    
    // Atualizar contadores
    const updates: any = {};
    
    if (status === 'succeeded') {
      updates.completed_predictions = (job.completed_predictions || 0) + 1;
    } else if (status === 'failed') {
      updates.failed_predictions = (job.failed_predictions || 0) + 1;
    }
    
    // Verificar se job está completo
    const totalCompleted = (updates.completed_predictions || job.completed_predictions || 0) + 
                          (updates.failed_predictions || job.failed_predictions || 0);
                          
    if (totalCompleted >= job.total_predictions) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('generation_jobs')
        .update(updates)
        .eq('id', job.id);
    }
  }
}

/**
 * Registra evento de geração
 * @param eventData - Dados do evento
 * @param supabase - Cliente Supabase
 */
async function logGenerationEvent(
  eventData: any,
  supabase: any
): Promise<void> {
  try {
    await supabase
      .from('generation_events')
      .insert({
        event_type: eventData.type,
        event_data: eventData,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('[WEBHOOK] Erro ao registrar evento:', error);
    // Não falhar o webhook por causa de log
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
    await processWebhookWithRetry(webhookData, supabase);
    
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