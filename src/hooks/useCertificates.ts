import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Interfaces para tipagem
interface Certificate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  background_color: string;
  text_color: string;
  font_family: string;
  border_style: string;
  signature_line: boolean;
  main_text: string;
  footer_text: string;
  course_id: string;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
    description: string;
  };
}

interface UserCertificate {
  id: string;
  user_id: string;
  certificate_id: string;
  issued_at: string;
  certificate_url?: string;
  created_at: string;
  certificate: Certificate;
  user?: {
    full_name: string;
    email: string;
  };
}

interface UseCertificatesReturn {
  certificates: UserCertificate[];
  loading: boolean;
  error: string | null;
  generateCertificate: (userCertificateId: string) => Promise<string | null>;
  downloadCertificate: (userCertificateId: string, fileName?: string) => Promise<void>;
  refreshCertificates: () => Promise<void>;
}

/**
 * Hook para gerenciar certificados do usuário
 * Fornece funcionalidades para listar, gerar e baixar certificados
 */
export function useCertificates(): UseCertificatesReturn {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega os certificados do usuário atual
   */
  const loadCertificates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_certificates')
        .select(`
          id,
          user_id,
          certificate_id,
          issued_at,
          certificate_url,
          created_at,
          certificate:certificates (
            id,
            title,
            subtitle,
            description,
            background_color,
            text_color,
            font_family,
            border_style,
            signature_line,
            main_text,
            footer_text,
            course_id,
            created_at,
            updated_at,
            course:courses (
              title,
              description
            )
          ),
          user:profiles (
            full_name,
            email
          )
        `)
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCertificates(data || []);
    } catch (err) {
      console.error('Erro ao carregar certificados:', err);
      setError('Erro ao carregar certificados');
      toast.error('Erro ao carregar certificados');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gera um certificado em PDF usando a Edge Function
   */
  const generateCertificate = async (userCertificateId: string): Promise<string | null> => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Chamar Edge Function para gerar certificado
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-certificate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userCertificateId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar certificado');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar certificado');
      }

      // Atualizar lista de certificados
      await refreshCertificates();
      
      toast.success('Certificado gerado com sucesso!');
      return result.certificateUrl;

    } catch (err) {
      console.error('Erro ao gerar certificado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar certificado';
      toast.error(errorMessage);
      return null;
    }
  };

  /**
   * Faz download do certificado
   */
  const downloadCertificate = async (userCertificateId: string, fileName?: string): Promise<void> => {
    try {
      // Encontrar o certificado na lista
      const certificate = certificates.find(cert => cert.id === userCertificateId);
      if (!certificate) {
        throw new Error('Certificado não encontrado');
      }

      let certificateUrl = certificate.certificate_url;

      // Se não tem URL, gerar primeiro
      if (!certificateUrl) {
        certificateUrl = await generateCertificate(userCertificateId);
        if (!certificateUrl) {
          throw new Error('Erro ao gerar certificado para download');
        }
      }

      // Fazer download
      const response = await fetch(certificateUrl);
      if (!response.ok) {
        throw new Error('Erro ao baixar certificado');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Criar link temporário para download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `certificado-${certificate.certificate.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Certificado baixado com sucesso!');

    } catch (err) {
      console.error('Erro ao baixar certificado:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao baixar certificado';
      toast.error(errorMessage);
    }
  };

  /**
   * Recarrega a lista de certificados
   */
  const refreshCertificates = async (): Promise<void> => {
    await loadCertificates();
  };

  // Carregar certificados quando o usuário mudar
  useEffect(() => {
    loadCertificates();
  }, [user]);

  return {
    certificates,
    loading,
    error,
    generateCertificate,
    downloadCertificate,
    refreshCertificates,
  };
}

/**
 * Hook para gerenciar certificados de todos os usuários (admin/instrutor)
 */
export function useAllCertificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<UserCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todos os certificados (apenas para admin/instrutor)
   */
  const loadAllCertificates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Verificar permissões
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'instructor'].includes(profile.role)) {
        throw new Error('Sem permissão para acessar todos os certificados');
      }

      const { data, error: fetchError } = await supabase
        .from('user_certificates')
        .select(`
          id,
          user_id,
          certificate_id,
          issued_at,
          certificate_url,
          created_at,
          certificate:certificates (
            id,
            title,
            subtitle,
            description,
            background_color,
            text_color,
            font_family,
            border_style,
            signature_line,
            main_text,
            footer_text,
            course_id,
            created_at,
            updated_at,
            course:courses (
              title,
              description
            )
          ),
          user:profiles (
            full_name,
            email
          )
        `)
        .order('issued_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setCertificates(data || []);
    } catch (err) {
      console.error('Erro ao carregar todos os certificados:', err);
      setError('Erro ao carregar certificados');
      toast.error('Erro ao carregar certificados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar certificados quando o usuário mudar
  useEffect(() => {
    loadAllCertificates();
  }, [user]);

  return {
    certificates,
    loading,
    error,
    refreshCertificates: loadAllCertificates,
  };
}

/**
 * Hook para gerenciar templates de certificados
 */
export function useCertificateTemplates() {
  const [templates, setTemplates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carrega todos os templates de certificados
   */
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('certificates')
        .select(`
          id,
          title,
          subtitle,
          description,
          background_color,
          text_color,
          font_family,
          border_style,
          signature_line,
          main_text,
          footer_text,
          course_id,
          created_at,
          updated_at,
          course:courses (
            title,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setTemplates(data || []);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
      setError('Erro ao carregar templates');
      toast.error('Erro ao carregar templates de certificados');
    } finally {
      setLoading(false);
    }
  };

  // Carregar templates na inicialização
  useEffect(() => {
    loadTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    refreshTemplates: loadTemplates,
  };
}