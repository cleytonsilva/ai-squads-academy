import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast as showToast } from '@/hooks/use-toast';
import { handleSupabaseError, executeWithRetry } from '@/utils/supabaseErrorHandler';

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
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const handleCoverUpdate = useCallback((payload: any) => {
    const { course_id, cover_image_url } = payload;
    
    console.log('[REALTIME] Capa atualizada:', { course_id, cover_image_url });
    
    // Se estamos monitorando um curso específico
    if (courseId && course_id === courseId) {
      showToast({
        title: "Sucesso",
        description: "Capa do curso atualizada!"
      });
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
          showToast({
            title: "Info",
            description: "Iniciando geração de capa..."
          });
          break;
        case 'calling_api':
          showToast({
            title: "Info",
            description: "Processando com IA..."
          });
          break;
        case 'prediction_created':
          showToast({
            title: "Info",
            description: "Predição criada! Aguardando resultado..."
          });
          break;
        case 'failed':
          showToast({
            title: "Erro",
            description: `Erro na geração: ${details?.error || 'Erro desconhecido'}`,
            variant: "destructive"
          });
          break;
      }
    }
  }, [courseId]);

  const setupRealtimeConnection = useCallback(async () => {
    try {
      console.log('[REALTIME] Configurando conexões em tempo real...');
      
      // Canal para atualizações de capas com tratamento de erro
      const coverChannel = supabase
        .channel(`course_updates_${Date.now()}`)
        .on('broadcast', { event: 'cover_updated' }, ({ payload }) => {
          try {
            handleCoverUpdate(payload);
          } catch (error) {
            console.warn('[REALTIME] Erro ao processar atualização de capa:', error);
            handleSupabaseError(error, false);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          console.log('[REALTIME] Canal de capas sincronizado');
          setIsConnected(true);
          setRetryCount(0);
        })
        .on('presence', { event: 'join' }, () => {
          console.log('[REALTIME] Conectado ao canal de capas');
        })
        .on('presence', { event: 'leave' }, () => {
          console.log('[REALTIME] Desconectado do canal de capas');
          setIsConnected(false);
        });

      // Canal para eventos de progresso com tratamento de erro
      const progressChannel = supabase
        .channel(`generation_progress_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'generation_events',
            filter: 'event_type=eq.generation_progress'
          },
          (payload) => {
            try {
              const eventData = payload.new.event_data;
              if (eventData) {
                handleProgressUpdate(eventData);
              }
            } catch (error) {
              console.warn('[REALTIME] Erro ao processar evento de progresso:', error);
              handleSupabaseError(error, false);
            }
          }
        )
        .on('presence', { event: 'sync' }, () => {
          console.log('[REALTIME] Canal de progresso sincronizado');
        });

      // Subscrever com retry automático
      const subscribeWithRetry = async (channel: any, channelName: string) => {
        try {
          const result = await executeWithRetry(async () => {
            const status = await new Promise<string>((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout ao subscrever ${channelName}`));
              }, 10000); // 10 segundos de timeout

              channel.subscribe((status: string) => {
                clearTimeout(timeoutId);
                if (status === 'SUBSCRIBED') {
                  console.log(`[REALTIME] ${channelName} subscrito com sucesso`);
                  resolve(status);
                } else if (status === 'CHANNEL_ERROR') {
                  reject(new Error(`Erro ao subscrever ${channelName}`));
                } else if (status === 'TIMED_OUT') {
                  reject(new Error(`Timeout ao subscrever ${channelName}`));
                }
              });
            });
            return status;
          }, 2, 1000, false); // Máximo 2 tentativas para conexões realtime, sem log de erro automático
          
          if (!result.success) {
            // Não lança erro; apenas retorna null para seguir sem este canal
            console.debug(`[REALTIME] ${channelName} indisponível:`, result.error);
            return null;
          }
          
          return result.data;
        } catch (error) {
          // Falha silenciosa sem propagar o erro
          console.debug(`[REALTIME] Falha silenciosa ao conectar ${channelName}:`, error);
          return null;
        }
      };

      // Subscrever aos canais com tratamento individual de erros (não bloqueante)
      const coverStatus = await subscribeWithRetry(coverChannel, 'canal de capas');
      if (!coverStatus) {
        console.debug('[REALTIME] Continuando sem canal de capas');
      }

      const progressStatus = await subscribeWithRetry(progressChannel, 'canal de progresso');
      if (!progressStatus) {
        console.debug('[REALTIME] Continuando sem canal de progresso');
      }

      return { coverChannel, progressChannel };
    } catch (error) {
      console.warn('[REALTIME] Erro ao configurar conexões:', error);
      
      // Tentar reconectar após um delay apenas se for um erro crítico
      if (retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, Math.pow(2, retryCount) * 2000); // Backoff exponencial mais conservador
      } else {
        console.warn('[REALTIME] Máximo de tentativas atingido, funcionando sem tempo real');
      }
      
      // Não fazer throw para não quebrar a aplicação
      return { coverChannel: null, progressChannel: null };
    }
  }, [handleCoverUpdate, handleProgressUpdate, retryCount]);

  useEffect(() => {
    let channels: { coverChannel: any; progressChannel: any } | null = null;

    const initConnection = async () => {
      try {
        channels = await setupRealtimeConnection();
      } catch (error) {
        console.warn('[REALTIME] Falha ao inicializar conexões:', error);
      }
    };

    initConnection();

    // Cleanup
    return () => {
      if (channels) {
        console.log('[REALTIME] Limpando canais...');
        try {
          if (channels.coverChannel) {
            supabase.removeChannel(channels.coverChannel);
          }
          if (channels.progressChannel) {
            supabase.removeChannel(channels.progressChannel);
          }
        } catch (error) {
          console.warn('[REALTIME] Erro ao limpar canais:', error);
        }
      }
      setIsConnected(false);
    };
  }, [setupRealtimeConnection]);

  return {
    // Função para invalidar cache manualmente
    invalidateCache: useCallback((imageUrl: string) => {
      const img = new Image();
      img.src = imageUrl + '?t=' + Date.now();
    }, []),
    // Status da conexão
    isConnected,
    // Função para reconectar manualmente
    reconnect: useCallback(() => {
      setRetryCount(0);
      setupRealtimeConnection();
    }, [setupRealtimeConnection])
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