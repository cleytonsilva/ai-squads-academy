/**
 * Utilitários para gerenciamento de imagens no Storage do Supabase
 * Funções para download de imagens externas e upload para bucket local
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

/**
 * Interface para resultado de upload de imagem
 */
export interface ImageUploadResult {
  success: boolean;
  publicUrl?: string;
  filePath?: string;
  error?: string;
}

/**
 * Interface para metadados de imagem
 */
export interface ImageMetadata {
  courseId?: string;
  moduleId?: string;
  predictionId?: string;
  originalUrl?: string;
  contentType?: string;
}

/**
 * Faz download de uma imagem de URL externa
 * @param imageUrl - URL da imagem para download
 * @param maxRetries - Número máximo de tentativas
 * @returns ArrayBuffer da imagem ou erro
 */
export async function downloadImageFromUrl(
  imageUrl: string,
  maxRetries: number = 3
): Promise<{ data?: ArrayBuffer; error?: string; contentType?: string }> {
  let lastError: any = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[IMAGE_DOWNLOAD] Tentativa ${attempt + 1}/${maxRetries} para ${imageUrl}`);
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Supabase-Edge-Function/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      
      console.log(`[IMAGE_DOWNLOAD] Download bem-sucedido: ${arrayBuffer.byteLength} bytes`);
      return { data: arrayBuffer, contentType };
      
    } catch (error: any) {
      lastError = error;
      console.error(`[IMAGE_DOWNLOAD] Tentativa ${attempt + 1} falhou:`, error.message);
      
      if (attempt < maxRetries - 1) {
        // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return { error: `Falha no download após ${maxRetries} tentativas: ${lastError?.message}` };
}

/**
 * Gera nome único para arquivo baseado em metadados
 * @param metadata - Metadados da imagem
 * @param extension - Extensão do arquivo
 * @returns Nome único do arquivo
 */
export function generateUniqueFileName(
  metadata: ImageMetadata,
  extension: string = 'jpg'
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  if (metadata.courseId) {
    return `courses/${metadata.courseId}/${timestamp}-${random}.${extension}`;
  } else if (metadata.moduleId) {
    return `modules/${metadata.moduleId}/${timestamp}-${random}.${extension}`;
  } else {
    return `generated/${timestamp}-${random}.${extension}`;
  }
}

/**
 * Determina extensão do arquivo baseada no content-type
 * @param contentType - Tipo de conteúdo da imagem
 * @returns Extensão do arquivo
 */
export function getFileExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  
  return typeMap[contentType.toLowerCase()] || 'jpg';
}

/**
 * Faz upload de imagem para o Storage do Supabase
 * @param supabase - Cliente Supabase
 * @param imageBuffer - Buffer da imagem
 * @param metadata - Metadados da imagem
 * @param contentType - Tipo de conteúdo
 * @returns Resultado do upload
 */
export async function uploadImageToStorage(
  supabase: any,
  imageBuffer: ArrayBuffer,
  metadata: ImageMetadata,
  contentType: string = 'image/jpeg'
): Promise<ImageUploadResult> {
  try {
    // Gerar nome único do arquivo
    const extension = getFileExtensionFromContentType(contentType);
    const fileName = generateUniqueFileName(metadata, extension);
    
    console.log(`[IMAGE_UPLOAD] Iniciando upload: ${fileName}`);
    
    // Converter ArrayBuffer para Uint8Array
    const uint8Array = new Uint8Array(imageBuffer);
    
    // Upload para o bucket course-images
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(fileName, uint8Array, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[IMAGE_UPLOAD] Erro no upload:', error);
      return {
        success: false,
        error: `Erro no upload: ${error.message}`
      };
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(data.path);

    console.log(`[IMAGE_UPLOAD] Upload bem-sucedido: ${publicUrl}`);
    
    return {
      success: true,
      publicUrl,
      filePath: data.path
    };
    
  } catch (error: any) {
    console.error('[IMAGE_UPLOAD] Erro inesperado:', error);
    return {
      success: false,
      error: `Erro inesperado: ${error.message}`
    };
  }
}

/**
 * Função completa para download e upload de imagem
 * @param supabase - Cliente Supabase
 * @param imageUrl - URL da imagem externa
 * @param metadata - Metadados da imagem
 * @returns Resultado do processo completo
 */
export async function downloadAndUploadImage(
  supabase: any,
  imageUrl: string,
  metadata: ImageMetadata
): Promise<ImageUploadResult> {
  try {
    console.log(`[IMAGE_PROCESS] Iniciando download e upload para: ${imageUrl}`);
    
    // Download da imagem
    const downloadResult = await downloadImageFromUrl(imageUrl);
    
    if (downloadResult.error || !downloadResult.data) {
      return {
        success: false,
        error: downloadResult.error || 'Falha no download da imagem'
      };
    }
    
    // Upload para Storage
    const uploadResult = await uploadImageToStorage(
      supabase,
      downloadResult.data,
      { ...metadata, originalUrl: imageUrl },
      downloadResult.contentType
    );
    
    if (uploadResult.success) {
      console.log(`[IMAGE_PROCESS] Processo completo bem-sucedido: ${uploadResult.publicUrl}`);
    }
    
    return uploadResult;
    
  } catch (error: any) {
    console.error('[IMAGE_PROCESS] Erro no processo:', error);
    return {
      success: false,
      error: `Erro no processo: ${error.message}`
    };
  }
}

/**
 * Valida se uma URL é uma imagem válida
 * @param url - URL para validar
 * @returns boolean indicando se é válida
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    
    return validExtensions.some(ext => pathname.endsWith(ext)) ||
           url.includes('replicate.delivery') ||
           url.includes('replicate.com');
  } catch {
    return false;
  }
}