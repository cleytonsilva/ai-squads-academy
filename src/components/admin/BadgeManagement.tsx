import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminBadgeManagement from './AdminBadgeManagement';
import StudentBadgeView from '../student/StudentBadgeView';

/**
 * Componente principal para gerenciamento de badges
 * Renderiza diferentes views baseado no papel do usuário
 */
export default function BadgeManagement() {
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Verifica o papel do usuário atual
   */
  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar perfil:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar permissões",
          variant: "destructive"
        });
        return;
      }

      setUserRole(profile?.role || 'student');
    } catch (err) {
      console.error('Erro ao verificar papel do usuário:', err);
      toast({
        title: "Erro",
        description: "Erro ao verificar permissões",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserRole();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando...</span>
      </div>
    );
  }

  // Renderiza componente baseado no papel do usuário
  if (userRole === 'admin' || userRole === 'instructor') {
    return <AdminBadgeManagement />;
  }

  return <StudentBadgeView />;
}