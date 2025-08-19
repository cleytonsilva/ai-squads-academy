import { supabase } from "@/integrations/supabase/client";

/**
 * Transforma URLs do Replicate para usar o proxy da Edge Function
 * Para evitar problemas de CORS/ORB com replicate.delivery
 */
export function getSafeImageUrl(originalUrl: string): string {
  // Se não é uma URL do replicate.delivery, retorna como está
  if (!originalUrl?.includes("replicate.delivery")) {
    return originalUrl;
  }
  
  // Constrói URL do proxy via Edge Function
  const supabaseUrl = supabase.supabaseUrl;
  const proxyUrl = `${supabaseUrl}/functions/v1/image-proxy?url=${encodeURIComponent(originalUrl)}`;
  
  return proxyUrl;
}

/**
 * Transforma todas as URLs do Replicate em um HTML para usar o proxy
 */
export function transformReplicateUrlsInHtml(html: string): string {
  if (!html) return html;
  
  // Encontra todas as URLs do replicate.delivery no HTML
  const replicateRegex = /(https:\/\/replicate\.delivery\/[^"\s)]+)/g;
  
  return html.replace(replicateRegex, (match) => {
    return getSafeImageUrl(match);
  });
}

/**
 * Hook para processar e fazer cache de imagens via Edge Function
 */
export async function cacheReplicateImages(courseId?: string, moduleId?: string, force = false) {
  try {
    const supabaseUrl = supabase.supabaseUrl;
    const response = await fetch(`${supabaseUrl}/functions/v1/image-proxy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabase.supabaseKey}`,
      },
      body: JSON.stringify({
        courseId,
        moduleId,
        force
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log("[IMAGE_CACHE] Resultado:", result);
    
    return result;
    
  } catch (error) {
    console.error("[IMAGE_CACHE] Erro ao processar imagens:", error);
    throw error;
  }
}