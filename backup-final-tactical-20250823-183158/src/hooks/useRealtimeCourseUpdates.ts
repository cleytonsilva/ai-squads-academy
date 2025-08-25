import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook para escutar atualizações de cursos em tempo real
 * Invalida cache e atualiza interface automaticamente
 */
export function useRealtimeCourseUpdates({
  onCoverUpdated,
  courseId
}: {
  onCoverUpdated?: (courseId: string, newImageUrl: string) => void;
  courseId?: string;
}) {
  const handleCoverUpdate = useCallback((payload: any) => {
    const { course_id, cover_image_url } = payload;
    
    console.log('[REALTIME] Capa atualizada:', { course_id, cover_image_url });
    
    // Se estamos monitorando um curso específico
    if (courseId && course_id === courseId) {
      toast.success('Capa do curso atualizada!');
      onCoverUpdated?.(course_id, cover_image_url);
      
      // Forçar reload da página após um delay para garantir que a nova imagem seja carregada
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else if (!courseId) {
      // Monitoramento global
      onCoverUpdated?.(course_id, cover_image_url);
      
      // Invalidar cache de imagens
      if (cover_image_url) {
        const img = new Image();
        img.src = cover_image_url + '?t=' + Date.now();
      }
    }
  }, [courseId, onCoverUpdated]);

  const handleProgressUpdate = useCallback((payload: any) => {
    const { course_id, status, details } = payload;
    
    if (courseId && course_id === courseId) {
      switch (status) {
        case 'starting':
          toast.info('Iniciando geração de capa...');
          break;
        case 'calling_api':
          toast.info('Processando com IA...');
          break;
        case 'prediction_created':
          toast.info('Predição criada! Aguardando resultado...');
          break;
        case 'failed':
          toast.error(`Erro na geração: ${details?.error || 'Erro desconhecido'}`);
          break;
      }
    }
  }, [courseId]);

  useEffect(() => {
    // Canal para atualizações de capas
    const coverChannel = supabase
      .channel('course_updates')
      .on('broadcast', { event: 'cover_updated' }, ({ payload }) => {
        handleCoverUpdate(payload);
      })
      .subscribe();

    // Canal para eventos de progresso
    const progressChannel = supabase
      .channel('generation_progress')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'generation_events',
          filter: 'event_type=eq.generation_progress'
        },
        (payload) => {
          const eventData = payload.new.event_data;
          if (eventData) {
            handleProgressUpdate(eventData);
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(coverChannel);
      supabase.removeChannel(progressChannel);
    };
  }, [handleCoverUpdate, handleProgressUpdate]);

  return {
    // Função para invalidar cache manualmente
    invalidateCache: useCallback((imageUrl: string) => {
      const img = new Image();
      img.src = imageUrl + '?t=' + Date.now();
    }, [])
  };
}

/**
 * Hook simplificado para monitoramento global de atualizações
 */
export function useGlobalCourseUpdates() {
  return useRealtimeCourseUpdates({
    onCoverUpdated: (courseId, newImageUrl) => {
      console.log('[GLOBAL] Curso atualizado:', courseId, newImageUrl);
      
      // Invalidar cache da imagem
      const img = new Image();
      img.src = newImageUrl + '?t=' + Date.now();
      
      // Atualizar qualquer elemento de imagem na página
      const images = document.querySelectorAll(`img[src*="${courseId}"]`);
      images.forEach((img) => {
        const element = img as HTMLImageElement;
        const currentSrc = element.src;
        element.src = '';
        setTimeout(() => {
          element.src = newImageUrl + '?t=' + Date.now();
        }, 100);
      });
    }
  });
}