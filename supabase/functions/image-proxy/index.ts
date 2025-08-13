import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Faz download de uma imagem e faz upload para o Supabase Storage
 */
async function downloadAndUploadImage(
  imageUrl: string,
  filename: string,
  bucket: string,
  supabase: any
): Promise<string | null> {
  try {
    console.log(`[PROXY] Fazendo download de: ${imageUrl}`);
    
    // Download da imagem
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`[PROXY] Erro ao baixar imagem: ${response.status}`);
      return null;
    }
    
    const imageBlob = await response.blob();
    console.log(`[PROXY] Download concluído, tamanho: ${imageBlob.size} bytes`);
    
    // Upload para o Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, imageBlob, {
        contentType: imageBlob.type || 'image/webp',
        upsert: true
      });
    
    if (error) {
      console.error(`[PROXY] Erro ao fazer upload:`, error);
      return null;
    }
    
    // Retorna a URL pública
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);
    
    console.log(`[PROXY] Upload concluído: ${publicData.publicUrl}`);
    return publicData.publicUrl;
    
  } catch (error) {
    console.error(`[PROXY] Erro no processo:`, error);
    return null;
  }
}

/**
 * Transforma URLs do Replicate em URLs locais no conteúdo HTML
 */
function transformReplicateUrls(html: string, urlMapping: Record<string, string>): string {
  let transformedHtml = html;
  
  // Substitui todas as URLs do replicate.delivery encontradas
  for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
    const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    transformedHtml = transformedHtml.replace(regex, newUrl);
  }
  
  return transformedHtml;
}

/**
 * Extrai URLs do Replicate de um texto HTML
 */
function extractReplicateUrls(html: string): string[] {
  const replicateRegex = /https:\/\/replicate\.delivery\/[^"\s)]+/g;
  const matches = html.match(replicateRegex) || [];
  return [...new Set(matches)]; // Remove duplicatas
}

/**
 * Gera um nome de arquivo único baseado na URL
 */
function generateFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    // Se tem extensão, usa como está
    if (filename.includes('.')) {
      return `replicate-cache/${filename}`;
    }
    
    // Senão, adiciona .webp como padrão
    return `replicate-cache/${filename}.webp`;
  } catch {
    // Fallback: usa timestamp + hash da URL
    const hash = Array.from(url)
      .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
      .toString(36);
    return `replicate-cache/${Date.now()}-${Math.abs(hash)}.webp`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Configurações do Supabase não encontradas" }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // GET: Serve uma imagem específica (proxy direto)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const imageUrl = url.searchParams.get("url");
      
      if (!imageUrl || !imageUrl.includes("replicate.delivery")) {
        return new Response("URL inválida", { status: 400, headers: corsHeaders });
      }
      
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          return new Response("Imagem não encontrada", { status: 404, headers: corsHeaders });
        }
        
        const imageData = await response.arrayBuffer();
        const contentType = response.headers.get("content-type") || "image/webp";
        
        return new Response(imageData, {
          headers: {
            ...corsHeaders,
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000", // Cache por 1 ano
          },
        });
      } catch (error) {
        console.error("Erro no proxy de imagem:", error);
        return new Response("Erro no proxy", { status: 500, headers: corsHeaders });
      }
    }

    // POST: Processa e faz cache de imagens do conteúdo
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { courseId, moduleId, force = false } = body;
      
      if (!courseId && !moduleId) {
        return new Response(
          JSON.stringify({ error: "courseId ou moduleId obrigatório" }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      // Busca os módulos a serem processados
      const query = supabase
        .from("modules")
        .select("id, content_jsonb");
      
      if (moduleId) {
        query.eq("id", moduleId);
      } else if (courseId) {
        query.eq("course_id", courseId);
      }
      
      const { data: modules, error: fetchError } = await query;
      
      if (fetchError) {
        console.error("Erro ao buscar módulos:", fetchError);
        return new Response(
          JSON.stringify({ error: "Erro ao buscar módulos" }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      if (!modules || modules.length === 0) {
        return new Response(
          JSON.stringify({ message: "Nenhum módulo encontrado" }), 
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }

      const results = {
        processed: 0,
        cached: 0,
        errors: 0,
        modules: [] as any[]
      };

      // Processa cada módulo
      for (const module of modules) {
        try {
          results.processed++;
          
          const html = module.content_jsonb?.html || "";
          if (!html) {
            results.modules.push({
              id: module.id,
              status: "skipped",
              reason: "Sem conteúdo HTML"
            });
            continue;
          }
          
          // Extrai URLs do Replicate
          const replicateUrls = extractReplicateUrls(html);
          
          if (replicateUrls.length === 0) {
            results.modules.push({
              id: module.id,
              status: "skipped",
              reason: "Nenhuma URL do Replicate encontrada"
            });
            continue;
          }
          
          console.log(`[PROXY] Processando ${replicateUrls.length} URLs no módulo ${module.id}`);
          
          // Faz cache das imagens
          const urlMapping: Record<string, string> = {};
          let cachedCount = 0;
          
          for (const url of replicateUrls) {
            const filename = generateFilename(url);
            
            // Verifica se já existe no storage (a menos que force=true)
            if (!force) {
              const { data: existingFile } = await supabase.storage
                .from("images")
                .list("replicate-cache", {
                  search: filename.split('/')[1]
                });
              
              if (existingFile && existingFile.length > 0) {
                const { data: publicData } = supabase.storage
                  .from("images")
                  .getPublicUrl(filename);
                urlMapping[url] = publicData.publicUrl;
                cachedCount++;
                continue;
              }
            }
            
            // Faz download e upload
            const newUrl = await downloadAndUploadImage(url, filename, "images", supabase);
            if (newUrl) {
              urlMapping[url] = newUrl;
              cachedCount++;
            }
          }
          
          // Atualiza o HTML se houve mudanças
          if (Object.keys(urlMapping).length > 0) {
            const transformedHtml = transformReplicateUrls(html, urlMapping);
            
            const { error: updateError } = await supabase
              .from("modules")
              .update({
                content_jsonb: {
                  ...module.content_jsonb,
                  html: transformedHtml
                }
              })
              .eq("id", module.id);
            
            if (updateError) {
              console.error(`Erro ao atualizar módulo ${module.id}:`, updateError);
              results.errors++;
              results.modules.push({
                id: module.id,
                status: "error",
                error: updateError.message
              });
            } else {
              results.cached += cachedCount;
              results.modules.push({
                id: module.id,
                status: "success",
                urlsProcessed: replicateUrls.length,
                urlsCached: cachedCount
              });
            }
          } else {
            results.modules.push({
              id: module.id,
              status: "failed",
              reason: "Nenhuma URL pôde ser processada"
            });
          }
          
        } catch (error) {
          console.error(`Erro ao processar módulo ${module.id}:`, error);
          results.errors++;
          results.modules.push({
            id: module.id,
            status: "error", 
            error: error.message
          });
        }
      }

      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response("Método não permitido", { 
      status: 405, 
      headers: corsHeaders 
    });

  } catch (error: any) {
    console.error("Erro na image-proxy function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});