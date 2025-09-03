import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import ImageGenerationDialog from './ImageGenerationDialog';
import { useRealtimeCourseUpdates } from '@/hooks/useRealtimeCourseUpdates';
import { 
  handleSupabaseError, 
  executeWithRetry, 
  checkUserPermissions,
  SupabaseErrorType 
} from '@/utils/supabaseErrorHandler';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [generationStarted, setGenerationStarted] = useState(false);
  const { toast } = useToast();

  // Hook para escutar atualizações em tempo real
  const { invalidateCache } = useRealtimeCourseUpdates({
    courseId,
    onCoverUpdated: (updatedCourseId, newImageUrl) => {
      if (updatedCourseId === courseId) {
        console.log('[WRAPPER] Capa atualizada via realtime:', newImageUrl);
        setIsLoading(false);
        setGenerationStarted(false);
        onSuccess?.();
        onClose();
      }
    }
  });

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    checkAuthentication();
  }, []);

  async function checkAuthentication() {
    try {
      const permissionCheck = await checkUserPermissions(supabase);
      
      if (permissionCheck.success) {
        setIsAuthenticated(true);
        setUserRole(permissionCheck.data?.role || null);
        console.log('[AUTH] Usuário autenticado:', {
          userId: permissionCheck.data?.userId,
          role: permissionCheck.data?.role,
          isAuthorized: true
        });
      } else {
        console.log('[AUTH] Usuário não autorizado:', permissionCheck.error);
        setIsAuthenticated(false);
        setUserRole(null);
      }
      
      setAuthChecked(true);
    } catch (error) {
      console.error('[AUTH] Erro ao verificar autenticação:', error);
      handleSupabaseError(error, false);
      setIsAuthenticated(false);
      setUserRole(null);
      setAuthChecked(true);
    }
  }

  const handleGenerate = async (engine: string) => {
    // Verificar autenticação antes de prosseguir
    if (!authChecked) {
      toast({
        title: "Erro",
        description: "Verificando autenticação...",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado como admin ou instrutor para gerar imagens",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('[GENERATION] Iniciando geração de capa:', { courseId, engine });
      
      // Executar geração com retry automático
      const result = await executeWithRetry(async () => {
        const { data, error } = await supabase.functions.invoke('generate-course-cover', {
          body: {
            courseId,
            engine: engine || 'flux',
            regenerate: true
          }
        });
        
        if (error) throw error;
        return data;
      }, 2); // Máximo 2 tentativas para Edge Functions
      
      if (!result.success) {
        console.error('[GENERATION] Erro na função generate-course-cover:', result.error);
        
        // Tratar erro de autenticação especificamente
        if (result.errorType === SupabaseErrorType.AUTHENTICATION) {
          await checkAuthentication(); // Tentar reautenticar
        }
        
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      
      const data = result.data;
      console.log('[GENERATION] Resposta da função generate-course-cover:', data);
      
      // Verificar se a resposta indica sucesso
      if (data?.success || data?.predictionId || data?.jobId) {
        console.log('[GENERATION] Geração de capa iniciada com sucesso');
        setGenerationStarted(true);
        toast({
          title: "Sucesso",
          description: "Geração de capa iniciada! Acompanhe o progresso...",
        });
        
        // Não fechar o diálogo imediatamente, aguardar atualização em tempo real
        // O hook useRealtimeCourseUpdates irá fechar quando a capa for atualizada
      } else {
        console.warn('[GENERATION] Resposta inesperada:', data);
        toast({
          title: "Erro",
          description: data?.error || "Resposta inesperada do serviço de geração. Tente novamente.",
          variant: "destructive",
        });
      }
      
    } catch (error: unknown) {
      console.error('[GENERATION] Erro inesperado na geração de capa:', error);
      handleSupabaseError(error);
    } finally {
      // Só parar o loading se não iniciou a geração
      if (!generationStarted) {
        setIsLoading(false);
      }
    }
  };

  // Efeito para limpar estado quando o diálogo fechar
  useEffect(() => {
    if (!isOpen) {
      setGenerationStarted(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  return (
    <ImageGenerationDialog
      open={isOpen}
      onOpenChange={() => {
        // Só permitir fechar se não estiver gerando
        if (!isLoading && !generationStarted) {
          onClose();
        }
      }}
      onGenerate={handleGenerate}
      courseTitle={courseTitle}
      isLoading={isLoading || generationStarted}
      authChecked={authChecked}
      isAuthenticated={isAuthenticated}
      userRole={userRole}
    />
  );
}