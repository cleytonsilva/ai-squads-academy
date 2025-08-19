import React, { useState, useEffect } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
      toast.error('Verificando autenticação...');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Você precisa estar logado como admin ou instrutor para gerar imagens');
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
        if (error.message?.includes('401') || error.message?.includes('Not authenticated')) {
          toast.error('Erro de autenticação. Faça login novamente.');
          // Tentar reautenticar
          await checkAuthentication();
        } else if (error.message?.includes('403') || error.message?.includes('Not authorized')) {
          toast.error('Você não tem permissão para gerar imagens. Role necessário: admin ou instructor.');
        } else if (error.message?.includes('500') || error.message?.includes('Internal Server Error')) {
          toast.error('Erro interno do servidor. Verifique as configurações da Edge Function.');
        } else {
          toast.error(`Erro na geração de capa: ${error.message || 'Erro desconhecido'}`);
        }
        return;
      }
      
      console.log('[GENERATION] Resposta da função generate-course-cover:', data);
      
      // Verificar se a resposta indica sucesso
      if (data?.success || data?.predictionId || data?.jobId) {
        console.log('[GENERATION] Geração de capa iniciada com sucesso');
        toast.success('Geração de capa iniciada! A imagem será atualizada em breve.');
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        console.warn('[GENERATION] Resposta inesperada:', data);
        toast.error('Resposta inesperada do serviço de geração. Tente novamente.');
      }
      
    } catch (error: unknown) {
      console.error('[GENERATION] Erro inesperado na geração de capa:', error);
      toast.error('Erro inesperado. Verifique sua conexão e tente novamente.');
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
      authChecked={authChecked}
      isAuthenticated={isAuthenticated}
      userRole={userRole}
    />
  );
}