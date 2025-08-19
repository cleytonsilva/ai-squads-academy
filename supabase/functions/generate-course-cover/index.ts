/// <reference types="https://deno.land/x/deno@v1.28.2/lib/deno.d.ts" />
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Interfaces para tipagem
interface GenerateCoverRequest {
  courseId: string;
  engine?: 'flux' | 'recraft';
  regenerate?: boolean;
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
}

interface ReplicateResponse {
  id: string;
  status: string;
  urls: {
    get: string;
    cancel: string;
  };
}

/**
 * Valida os dados de entrada da requisição
 * @param body - Corpo da requisição
 * @returns Dados validados ou erro
 */
function validateRequest(body: any): { data?: GenerateCoverRequest; error?: string } {
  if (!body || typeof body !== 'object') {
    return { error: 'Corpo da requisição inválido' };
  }

  const { courseId, engine = 'flux', regenerate = false } = body;

  if (!courseId || typeof courseId !== 'string') {
    return { error: 'courseId é obrigatório e deve ser uma string' };
  }

  if (engine && !['flux', 'recraft'].includes(engine)) {
    return { error: 'engine deve ser "flux" ou "recraft"' };
  }

  return {
    data: {
      courseId,
      engine: engine as 'flux' | 'recraft',
      regenerate: Boolean(regenerate)
    }
  };
}

/**
 * Verifica se o usuário tem permissão para gerar capas
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @returns boolean indicando se tem permissão
 */
async function checkUserPermissions(
  supabase: any,
  userId: string
): Promise<{ authorized: boolean; role?: string }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.error('[AUTH] Erro ao buscar perfil:', error);
      return { authorized: false };
    }

    const authorized = ['admin', 'instructor'].includes(profile.role);
    return { authorized, role: profile.role };
  } catch (error) {
    console.error('[AUTH] Erro na verificação de permissões:', error);
    return { authorized: false };
  }
}

/**
 * Busca dados do curso
 * @param supabase - Cliente Supabase
 * @param courseId - ID do curso
 * @returns Dados do curso ou null
 */
async function getCourseData(
  supabase: any,
  courseId: string
): Promise<CourseData | null> {
  try {
    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, description, cover_image_url')
      .eq('id', courseId)
      .single();

    if (error || !course) {
      console.error('[COURSE] Erro ao buscar curso:', error);
      return null;
    }

    return course;
  } catch (error) {
    console.error('[COURSE] Erro inesperado ao buscar curso:', error);
    return null;
  }
}

/**
 * Gera prompt otimizado para criação de capa
 * @param course - Dados do curso
 * @param engine - Engine a ser usado
 * @returns Prompt para geração
 */
function generatePrompt(course: CourseData, engine: 'flux' | 'recraft'): string {
  const basePrompt = `Create a professional course cover image for "${course.title}". `;
  const description = course.description ? `Course description: ${course.description}. ` : '';
  
  if (engine === 'flux') {
    return basePrompt + description + 
      'Style: Modern, clean, educational design with vibrant colors. ' +
      'Include relevant icons or symbols related to the course topic. ' +
      'High quality, professional layout suitable for online learning platform. ' +
      'Aspect ratio 16:9, no text overlay needed.';
  } else {
    return basePrompt + description + 
      'Design a modern educational course thumbnail with clean typography and relevant imagery. ' +
      'Use a professional color scheme with good contrast. ' +
      'Include visual elements that represent the course subject matter. ' +
      'Format: 1920x1080 pixels, suitable for web display.';
  }
}

/**
 * Implementa delay para retry com backoff exponencial
 * @param attempt - Número da tentativa (começando em 0)
 * @returns Promise que resolve após o delay
 */
function delay(attempt: number): Promise<void> {
  const baseDelay = 1000; // 1 segundo
  const maxDelay = 10000; // 10 segundos
  const delayTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
  return new Promise(resolve => setTimeout(resolve, delayTime));
}

/**
 * Chama a API do Replicate para gerar imagem com retry automático
 * @param prompt - Prompt para geração
 * @param engine - Engine a ser usado
 * @param replicateToken - Token da API
 * @param webhookUrl - URL do webhook
 * @param maxRetries - Número máximo de tentativas
 * @returns Resposta da API ou erro
 */
async function callReplicateAPI(
  prompt: string,
  engine: 'flux' | 'recraft',
  replicateToken: string,
  webhookUrl: string,
  maxRetries: number = 3
): Promise<{ data?: ReplicateResponse; error?: string }> {
  // IDs de versão específicos dos modelos do Replicate
  const modelVersions = {
    flux: '80a09d66baa990429c2f5ae8a4306bf778a1b3775afd01cc2cc8bdbe9033769c', // black-forest-labs/flux-1.1-pro
    recraft: '0fea59248a8a1ddb8197792577f6627ec65482abc49f50c6e9da40ca8729d24d'  // recraft-ai/recraft-v3
  };

  const inputs = {
    flux: {
      prompt,
      aspect_ratio: '16:9',
      output_quality: 90,
      safety_tolerance: 2
    },
    recraft: {
      prompt,
      style: 'realistic_image',
      size: '1920x1080',
      output_format: 'webp'
    }
  };

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[REPLICATE] Tentativa ${attempt + 1}/${maxRetries + 1} para ${engine}`);

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${replicateToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: modelVersions[engine],
          input: inputs[engine],
          webhook: webhookUrl,
          webhook_events_filter: ['start', 'output', 'logs', 'completed']
        })
      });

      if (!response.ok) {
        let errorDetail = `Status ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.json();
            if (errorBody && errorBody.detail) {
                errorDetail = errorBody.detail;
            }
        } catch (e) {
            // Se o corpo não for JSON ou não tiver 'detail', usa o texto plano
            errorDetail = await response.text();
        }

        const error = new Error(`API Error: ${errorDetail}`);
        
        // Não retry para erros 4xx (exceto 429 - rate limit)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          console.error('[REPLICATE] Erro não recuperável:', response.status, errorDetail);
          return { error: `Erro na API do Replicate: ${errorDetail}` };
        }
        
        lastError = error;
        console.error(`[REPLICATE] Tentativa ${attempt + 1} falhou:`, response.status, errorDetail);
        
        if (attempt < maxRetries) {
          await delay(attempt);
          continue;
        }
      } else {
        const data = await response.json();
        console.log('[REPLICATE] Predição criada com sucesso:', data.id);
        return { data };
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[REPLICATE] Erro na tentativa ${attempt + 1}:`, error.message);
      
      if (attempt < maxRetries) {
        await delay(attempt);
        continue;
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  const errorMessage = lastError?.message || 'Erro desconhecido';
  console.error('[REPLICATE] Todas as tentativas falharam:', errorMessage);
  return { error: `Erro ao conectar com Replicate após ${maxRetries + 1} tentativas: ${errorMessage}` };
}

/**
 * Salva predição no banco de dados com retry
 * @param supabase - Cliente Supabase
 * @param predictionData - Dados da predição
 * @param courseId - ID do curso
 * @param engine - Engine usado
 * @param prompt - Prompt usado
 * @param maxRetries - Número máximo de tentativas
 * @returns Sucesso ou erro
 */
async function savePrediction(
  supabase: any,
  predictionData: ReplicateResponse,
  courseId: string,
  engine: string,
  prompt: string,
  maxRetries: number = 2
): Promise<{ success: boolean; error?: string }> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[DB] Tentativa ${attempt + 1}/${maxRetries + 1} para salvar predição`);

      const { error } = await supabase
        .from('replicate_predictions')
        .insert({
          prediction_id: predictionData.id,
          course_id: courseId,
          prediction_type: 'course_cover',
          status: predictionData.status,
          input: {
            prompt,
            engine,
            type: 'course_cover',
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });

      if (error) {
        lastError = error;
        console.error(`[DB] Tentativa ${attempt + 1} falhou:`, error.message);
        
        // Se é erro de constraint (predição já existe), não retry
        if (error.code === '23505') {
          console.log('[DB] Predição já existe, considerando como sucesso');
          return { success: true };
        }
        
        if (attempt < maxRetries) {
          await delay(attempt);
          continue;
        }
      } else {
        console.log('[DB] Predição salva com sucesso:', predictionData.id);
        return { success: true };
      }
    } catch (error: any) {
      lastError = error;
      console.error(`[DB] Erro inesperado na tentativa ${attempt + 1}:`, error.message);
      
      if (attempt < maxRetries) {
        await delay(attempt);
        continue;
      }
    }
  }

  // Se chegou aqui, todas as tentativas falharam
  const errorMessage = lastError?.message || 'Erro desconhecido';
  console.error('[DB] Todas as tentativas de salvamento falharam:', errorMessage);
  return { success: false, error: errorMessage };
}

/**
 * Função principal da Edge Function
 */
serve(async (req) => {
  // Permite requisições OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas aceita requisições POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Validação de chaves de ambiente
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !REPLICATE_API_TOKEN) {
      const missingVars = [];
      if (!SUPABASE_URL) missingVars.push("SUPABASE_URL");
      if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
      if (!REPLICATE_API_TOKEN) missingVars.push("REPLICATE_API_TOKEN");

      console.error(`[ENV] Variável de ambiente essencial não configurada: ${missingVars.join(', ')}`);
      return new Response(
        JSON.stringify({ error: "Variável de ambiente essencial não configurada no servidor." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Lê e valida o corpo da requisição
    console.log('[REQUEST] Iniciando validação da requisição.');
    const body = await req.json();
    const validation = validateRequest(body);
    
    if (validation.error) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { courseId, engine, regenerate } = validation.data!;
    console.log('[REQUEST] Validação bem-sucedida:', { courseId, engine, regenerate });

    // Cria cliente do Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verifica autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autorização necessário" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extrai o token JWT
    const token = authHeader.replace('Bearer ', '');
    
    // Verificar se é Service Role Key (bypass auth para testes)
    const isServiceRole = token === SUPABASE_SERVICE_ROLE_KEY;
    
    let user = null;
    if (!isServiceRole) {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        return new Response(
          JSON.stringify({ error: "Token inválido ou expirado" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      user = authUser;
      
      // Verifica permissões do usuário
      const { authorized, role } = await checkUserPermissions(supabase, user.id);
      console.log(`[AUTH] Verificação de permissão para userId: ${user.id}. Resultado: ${authorized ? 'Autorizado' : 'Não autorizado'} (Role: ${role})`);
      if (!authorized) {
        return new Response(
          JSON.stringify({ 
            error: "Acesso negado. Apenas administradores e instrutores podem gerar capas.",
            userRole: role 
          }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.log('[AUTH] Usando Service Role Key - bypass de autenticação');
    }

    // Busca dados do curso
    console.log(`[COURSE] Buscando dados para o cursoId: ${courseId}.`);
    const course = await getCourseData(supabase, courseId);
    if (!course) {
      return new Response(
        JSON.stringify({ error: "Curso não encontrado" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log('[COURSE] Dados do curso encontrados:', { id: course.id, title: course.title });

    // Verifica se já existe capa e se deve regenerar
    if (course.cover_image_url && !regenerate) {
      return new Response(
        JSON.stringify({ 
          message: "Curso já possui capa. Use regenerate=true para gerar nova capa.",
          existingCover: course.cover_image_url
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Gera prompt para a IA
    const prompt = generatePrompt(course, engine);
    console.log('[GENERATION] Prompt gerado:', prompt);

    // Constrói URL do webhook
    const webhookUrl = `${SUPABASE_URL}/functions/v1/replicate-webhook`;

    // Chama API do Replicate com retry
    const replicateResult = await callReplicateAPI(
      prompt,
      engine,
      REPLICATE_API_TOKEN,
      webhookUrl,
      3 // máximo 3 tentativas
    );

    if (replicateResult.error) {
      return new Response(
        JSON.stringify({ error: replicateResult.error }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Salva predição no banco
    const saveResult = await savePrediction(
      supabase,
      replicateResult.data!,
      courseId,
      engine,
      prompt
    );

    if (!saveResult.success) {
      console.error('[GENERATION] Erro ao salvar predição:', saveResult.error);
      // Não falha a requisição, apenas loga o erro
    }

    console.log('[GENERATION] Geração de capa iniciada com sucesso:', {
      courseId,
      predictionId: replicateResult.data!.id,
      engine
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Geração de capa iniciada com sucesso",
        predictionId: replicateResult.data!.id,
        courseId,
        engine,
        status: replicateResult.data!.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("[GENERATION] Erro inesperado na função principal:", error.message);
    console.error("[GENERATION] Stack Trace:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: "Erro interno do servidor",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});