import { supabase } from '@/integrations/supabase/client';

type ToastFunction = (options: {
  title: string;
  description: string;
  variant?: "destructive" | "default";
}) => void;

/**
 * Upload de imagem para o Supabase Storage
 * @param file - Arquivo de imagem a ser enviado
 * @param courseId - ID do curso para organização dos arquivos
 * @param toast - Função toast para exibir notificações
 * @returns URL pública da imagem enviada
 */
export const uploadImageToSupabase = async (file: File, courseId: string, toast: ToastFunction): Promise<string> => {
  try {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      throw new Error('Apenas imagens são permitidas');
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Imagem muito grande. Máximo 5MB permitido.');
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `course-content/${courseId}/images/${fileName}`;

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('course-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Obter URL pública
    const { data } = supabase.storage
      .from('course-assets')
      .getPublicUrl(filePath);

    toast({
      title: "Sucesso",
      description: "Imagem enviada com sucesso!",
    });
    return data.publicUrl;
    
  } catch (error: any) {
    console.error('Erro no upload da imagem:', error);
    toast({
      title: "Erro",
      description: `Erro no upload: ${error.message}`,
      variant: "destructive",
    });
    throw error;
  }
};

/**
 * Remove imagem do Supabase Storage
 * @param imageUrl - URL da imagem a ser removida
 * @param toast - Função toast para exibir notificações
 */
export const deleteImageFromSupabase = async (imageUrl: string, toast: ToastFunction): Promise<void> => {
  try {
    // Extrair caminho do arquivo da URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('course-content')).join('/');

    const { error } = await supabase.storage
      .from('course-assets')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    toast({
      title: "Sucesso",
      description: "Imagem removida com sucesso!",
    });
  } catch (error: any) {
    console.error('Erro ao remover imagem:', error);
    toast({
      title: "Erro",
      description: `Erro ao remover imagem: ${error.message}`,
      variant: "destructive",
    });
  }
};

/**
 * Valida se uma URL é uma imagem válida
 * @param url - URL a ser validada
 * @returns true se for uma URL de imagem válida
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname);
  } catch {
    return false;
  }
};