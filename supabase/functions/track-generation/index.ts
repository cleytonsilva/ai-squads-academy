/// <reference types="https://deno.land/x/deno@v1.28.2/lib/deno.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interfaces para tipagem
interface JobProgress {
  percentage: number;
  completed: number;
  total: number;
  failed: number;
  status: string;
  estimatedTimeRemaining?: number;
}

interface PredictionSummary {
  id: string;
  type: 'course_cover' | 'module_image';
  status: string;
  output?: string;
  error?: string;
  metrics?: any;
  createdAt: string;
  completedAt?: string;
  moduleTitle?: string;
}

interface JobSummary {
  totalTime?: number;
  averageTimePerPrediction?: number;
  successRate: number;
  providerStats: Record<string, number>;
  errorBreakdown: Record<string, number>;
}

/**
 * Calcula o progresso do job
 * @param job - Dados do job
 * @returns Progresso calculado
 */
function calculateJobProgress(job: any): JobProgress {
  const total = job.total_predictions || 0;
  const completed = job.completed_predictions || 0;
  const failed = job.failed_predictions || 0;
  const inProgress = total - completed - failed;
  
  const percentage = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;
  
  // Estimar tempo restante baseado no progresso atual
  let estimatedTimeRemaining;
  if (job.status === 'processing' && inProgress > 0) {
    const avgTimePerPrediction = 60; // 60 segundos por predição
    estimatedTimeRemaining = inProgress * avgTimePerPrediction;
  }
  
  return {
    percentage,
    completed,
    total,
    failed,
    status: job.status,
    estimatedTimeRemaining
  };
}

/**
 * Gera resumo do job
 * @param job - Dados do job
 * @returns Resumo do job
 */
function generateJobSummary(job: any): JobSummary {
  const predictions = job.predictions || [];
  const completedPredictions = predictions.filter((p: any) => 
    p.status === 'succeeded' || p.status === 'failed'
  );
  
  // Taxa de sucesso
  const successfulPredictions = predictions.filter((p: any) => p.status === 'succeeded');
  const successRate = completedPredictions.length > 0 
    ? (successfulPredictions.length / completedPredictions.length) * 100 
    : 0;
  
  // Estatísticas de provedores (baseado nos logs ou métricas)
  const providerStats: Record<string, number> = {};
  predictions.forEach((p: any) => {
    if (p.metrics?.provider) {
      providerStats[p.metrics.provider] = (providerStats[p.metrics.provider] || 0) + 1;
    }
  });
  
  // Breakdown de erros
  const errorBreakdown: Record<string, number> = {};
  predictions.filter((p: any) => p.status === 'failed').forEach((p: any) => {
    const errorType = p.error ? 'api_error' : 'unknown_error';
    errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
  });
  
  // Tempo total e médio
  let totalTime, averageTimePerPrediction;
  if (job.created_at && job.completed_at) {
    totalTime = new Date(job.completed_at).getTime() - new Date(job.created_at).getTime();
    averageTimePerPrediction = completedPredictions.length > 0 
      ? totalTime / completedPredictions.length 
      : undefined;
  }
  
  return {
    totalTime,
    averageTimePerPrediction,
    successRate: Math.round(successRate),
    providerStats,
    errorBreakdown
  };
}

/**
 * Formata dados das predições para resposta
 * @param predictions - Array de predições
 * @param modules - Dados dos módulos (para títulos)
 * @returns Predições formatadas
 */
function formatPredictions(predictions: any[], modules: any[] = []): PredictionSummary[] {
  return predictions.map(p => {
    const module = modules.find(m => m.id === p.module_id);
    
    return {
      id: p.id,
      type: p.prediction_type,
      status: p.status,
      output: p.output,
      error: p.error,
      metrics: p.metrics,
      createdAt: p.created_at,
      completedAt: p.completed_at,
      moduleTitle: module?.title
    };
  });
}

/**
 * Validação de autenticação
 * @param req - Request object
 * @param supabase - Cliente Supabase
 * @returns Dados do usuário
 */
async function validateAuth(req: Request, supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Usuário não autenticado");
  }
  return user;
}

/**
 * Buscar dados completos do job
 * @param jobId - ID do job
 * @param supabase - Cliente Supabase
 * @returns Dados do job com predições
 */
async function fetchJobData(jobId: string, supabase: any) {
  // Buscar job principal
  const { data: job, error: jobError } = await supabase
    .from('generation_jobs')
    .select(`
      *,
      course:courses(id, title, description)
    `)
    .eq('id', jobId)
    .single();
    
  if (jobError || !job) {
    throw new Error("Job não encontrado");
  }
  
  // Buscar predições relacionadas
  const { data: predictions } = await supabase
    .from('replicate_predictions')
    .select('*')
    .eq('course_id', job.course_id)
    .gte('created_at', job.created_at)
    .order('created_at', { ascending: true });
  
  // Buscar módulos se necessário
  let modules = [];
  if (job.type === 'module_images' || job.type === 'both') {
    const moduleIds = job.config?.moduleIds || [];
    if (moduleIds.length > 0) {
      const { data: moduleData } = await supabase
        .from('modules')
        .select('id, title')
        .in('id', moduleIds);
      modules = moduleData || [];
    }
  }
  
  return { job, predictions: predictions || [], modules };
}

/**
 * Buscar eventos recentes do job
 * @param jobId - ID do job
 * @param supabase - Cliente Supabase
 * @param limit - Limite de eventos
 * @returns Eventos do job
 */
async function fetchJobEvents(jobId: string, supabase: any, limit = 10) {
  const { data: events } = await supabase
    .from('generation_events')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  return events || [];
}

/**
 * Handler principal
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  
  try {
    // Extrair jobId da URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const jobId = pathParts[pathParts.length - 1];
    
    if (!jobId || jobId === 'track-generation') {
      return new Response(JSON.stringify({ 
        error: "Job ID é obrigatório",
        usage: "GET /functions/v1/track-generation/{jobId}"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Configurar Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Configuração do Supabase incompleta");
    }
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { 
        headers: { 
          Authorization: req.headers.get("Authorization") || "" 
        } 
      }
    });
    
    // Validar autenticação
    const user = await validateAuth(req, supabase);
    
    console.log(`[TRACK] Buscando progresso do job ${jobId} para usuário ${user.id}`);
    
    // Buscar dados do job
    const { job, predictions, modules } = await fetchJobData(jobId, supabase);
    
    // Verificar se o usuário tem permissão para ver este job
    if (job.user_id !== user.id) {
      // Verificar se é admin/instructor
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
        
      if (!profile || !['admin', 'instructor'].includes(profile.role)) {
        return new Response(JSON.stringify({ error: "Acesso negado" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    
    // Calcular progresso
    const progress = calculateJobProgress(job);
    
    // Buscar eventos recentes (opcional)
    const includeEvents = url.searchParams.get('events') === 'true';
    let events = [];
    if (includeEvents) {
      events = await fetchJobEvents(jobId, supabase);
    }
    
    // Preparar resposta
    const response = {
      job: {
        id: job.id,
        courseId: job.course_id,
        courseName: job.course?.title,
        type: job.type,
        status: job.status,
        progress,
        config: job.config,
        estimatedCompletion: job.estimated_completion,
        createdAt: job.created_at,
        completedAt: job.completed_at,
        errorDetails: job.error_details
      },
      predictions: formatPredictions(predictions, modules),
      summary: generateJobSummary({ ...job, predictions }),
      ...(includeEvents && { events })
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error) {
    console.error("[TRACK] Erro ao buscar progresso:", error);
    
    const statusCode = error.message.includes("não encontrado") ? 404 :
                      error.message.includes("não autenticado") ? 401 :
                      error.message.includes("Acesso negado") ? 403 : 500;
    
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'TRACKING_ERROR'
    }), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});