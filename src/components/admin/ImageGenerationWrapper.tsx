import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageGenerationDialog from './ImageGenerationDialog';

interface ImageGenerationWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  onSuccess?: () => void;
}

export default function ImageGenerationWrapper({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onSuccess
}: ImageGenerationWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (engine: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-images', {
        body: { courseId, engine }
      });
      
      if (error) throw error;
      
      if (data?.requiresSecret) {
        toast.error('Chave da API Corcel não configurada. Verifique as variáveis de ambiente.');
        return;
      }
      
      toast.success('Imagens geradas com sucesso! Atualizando...');
      
      // Aguarda um pouco para o banco atualizar
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro na geração de imagens:', error);
      toast.error(error.message || 'Falha ao gerar imagens com IA');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageGenerationDialog
      open={isOpen}
      onOpenChange={onClose}
      onGenerate={handleGenerate}
      courseTitle={courseTitle}
      isLoading={isLoading}
    />
  );
}