import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setUser(null);
          return;
        }

        if (session?.user) {
          // Buscar dados adicionais do usuário na tabela profiles
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, role')
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.error('Erro ao buscar dados do usuário:', userError);
            // Usar dados básicos da sessão se não encontrar na tabela
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name
            });
          } else {
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Buscar dados do usuário quando logar
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, role')
            .eq('user_id', session.user.id)
            .single();

          setUser(userData || {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user
  };
}