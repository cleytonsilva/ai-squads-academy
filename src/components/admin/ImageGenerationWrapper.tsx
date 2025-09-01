import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import ImageGenerationDialog from './ImageGenerationDialog';
import { useRealtimeCourseUpdates } from '@/hooks/useRealtimeCourseUpdates';

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
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('[AUTH] Usuário não autenticado:', error?.message);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

      // Verificar role do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[AUTH] Erro ao buscar perfil:', profileError);
        setIsAuthenticated(false);
        setAuthChecked(true);
        return;
      }

      const role = profile?.role;
      setUserRole(role);
      setIsAuthenticated(!!user && ['admin', 'instructor'].includes(role));
      setAuthChecked(true);
      
      console.log('[AUTH] Usuário autenticado:', {
        userId: user.id,
        email: user.email,
        role: role,
        isAuthorized: ['admin', 'instructor'].includes(role)
      });
      
    } catch (error) {
      console.error('[AUTH] Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
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
      
      // Usar apenas a função generate-course-cover que está deployada
      const { data, error } = await supabase.functions.invoke('generate-course-cover', {
        body: {
          courseId,
          engine: engine || 'flux',
          regenerate: true
        }
      });
      
      if (error) {
        console.error('[GENERATION] Erro na função generate-course-cover:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Mensagem de erro mais específica baseada no tipo de erro
        if (error.message?.includes('401') || error.message?.includes('Not authenticated') || error.message?.includes('Token inválido')) {
          toast({
            title: "Erro",
            description: "Erro de autenticação. Faça login novamente como admin ou instrutor.",
            variant: "destructive",
          });
          // Tentar reautenticar
          await checkAuthentication();
        } else if (error.message?.includes('403') || error.message?.includes('Not authorized') || error.message?.includes('Acesso negado')) {
          toast({
            title: "Erro",
            description: "Você não tem permissão para gerar imagens. Role necessário: admin ou instructor.",
            variant: "destructive",
          });
        } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
          toast({
            title: "Erro",
            description: "Erro interno do servidor. Verifique as configurações da Edge Function.",
            variant: "destructive",
          });
        } else if (error.message?.includes('REPLICATE_API_TOKEN')) {
          toast({
            title: "Erro",
            description: "Token da API Replicate não configurado. Contate o administrador.",
            variant: "destructive",
          });
        } else if (error.message?.includes('Bucket not found')) {
          toast({
            title: "Erro",
            description: "Bucket de imagens não configurado. Contate o administrador.",
            variant: "destructive",
          });
        } else if (error.message?.includes('Edge Function returned a non-2xx status code')) {
          toast({
            title: "Erro",
            description: "Erro de autenticação ou permissão. Verifique se você está logado como admin/instrutor.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: `Erro na geração de capa: ${error.message || 'Erro desconhecido'}`,
            variant: "destructive",
          });
        }
        return;
      }
      
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
          description: "Resposta inesperada do serviço de geração. Tente novamente.",
          variant: "destructive",
        });
      }
      
    } catch (error: unknown) {
      console.error('[GENERATION] Erro inesperado na geração de capa:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
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