import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { 
  handleSupabaseError, 
  executeWithRetry, 
  safeSupabaseOperation,
  SupabaseErrorType 
} from '@/utils/supabaseErrorHandler';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
}

interface UserMetadata {
  username?: string;
  full_name?: string;
  display_name?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    try {
      // Limpar estado local primeiro para UX mais rápida
      setUser(null);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-ncrlojjfkhevjotchhxi-auth-token');
      
      // Tentar logout no Supabase com timeout reduzido
      const logoutPromise = supabase.auth.signOut({ scope: 'local' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 2000) // Reduzido para 2s
      );
      
      try {
        await Promise.race([logoutPromise, timeoutPromise]);
        console.log('✅ Logout do Supabase realizado com sucesso');
      } catch (logoutError) {
        console.warn('⚠️ Timeout no logout do Supabase (continuando com logout local):', logoutError);
        // Storage já foi limpo acima, então apenas continuar
      }
      
      // Navegar para página de auth
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('❌ Erro crítico no logout:', error);
      handleSupabaseError(error, false); // Log error but don't show toast
      // Garantir limpeza mesmo com erro crítico
      setUser(null);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-ncrlojjfkhevjotchhxi-auth-token');
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await executeWithRetry(async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;
      return data;
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    const data = result.data;
    if (data?.user) {
      // Buscar dados adicionais do perfil com retry
      const profileResult = await safeSupabaseOperation(() => 
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .maybeSingle(),
        false // Don't show toast for profile fetch errors
      );

      const userData = {
        ...data.user,
        profile: profileResult.success ? profileResult.data : null
      };

      setUser(userData as any);
      toast.success('Login realizado com sucesso!');
      return { success: true };
    }

    return { success: false, error: 'Dados de usuário inválidos' };
  }, []);

  const signUp = async (email: string, password: string, metadata?: UserMetadata) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Preparar dados do usuário
    const userData = {
      display_name: metadata?.display_name || metadata?.full_name || email.split('@')[0],
      username: metadata?.username,
      full_name: metadata?.full_name,
      ...metadata
    };
    
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { 
        emailRedirectTo: redirectUrl, 
        data: userData
      },
    });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    if (error) throw error;
  };

  useEffect(() => {
    let mounted = true;
    
    const checkSession = async () => {
      try {
        console.log('🔍 useAuth.ts:90 Iniciando verificação de sessão...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ useAuth.ts:94 Erro ao obter sessão:', error);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        if (!session) {
          console.log('⚠️ useAuth.ts:103 Nenhuma sessão encontrada');
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Log detalhado da sessão
        console.log('📊 useAuth.ts:112 Sessão encontrada:', {
          user_id: session.user?.id,
          email: session.user?.email,
          expires_at: session.expires_at,
          current_time: Math.floor(Date.now() / 1000),
          time_until_expiry: session.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 'N/A',
          access_token_length: session.access_token?.length || 0
        });

        // Verificar se o token expirou
        const now = Math.floor(Date.now() / 1000);
        if (session.expires_at && session.expires_at <= now) {
          console.log('⏰ useAuth.ts:123 Token expirado, fazendo logout...', {
            expires_at: session.expires_at,
            current_time: now,
            difference: now - session.expires_at
          });
          await signOut();
          return;
        }

        if (session?.user) {
          console.log('👤 useAuth.ts:130 Sessão encontrada, buscando dados do usuário...');
          // Buscar dados adicionais do usuário na tabela profiles
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, role')
            .eq('user_id', session.user.id)
            .single();

          if (userError) {
            console.warn('❌ useAuth.ts:138 Erro ao buscar dados do usuário:', userError);
            // Usar dados básicos da sessão se não encontrar na tabela
            const fallbackUser = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name,
              role: 'student'
            };
            console.log('🔄 useAuth.ts:146 Usando dados fallback:', fallbackUser);
            if (mounted) {
              setUser(fallbackUser);
            }
          } else {
            console.log('✅ useAuth.ts:151 Dados do usuário encontrados:', userData);
            if (mounted) {
              setUser(userData);
            }
          }
        } else {
          console.log('❌ useAuth.ts:157 Nenhum usuário na sessão');
          if (mounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ useAuth.ts:164 Erro ao verificar autenticação:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log('✅ useAuth.ts:171 Verificação de sessão concluída');
        }
      }
    };

    checkSession();

    // Escutar mudanças na autenticação com refresh automático
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 useAuth.ts:180 Auth state change:', {
          event,
          user_email: session?.user?.email,
          session_exists: !!session,
          expires_at: session?.expires_at,
          current_time: Math.floor(Date.now() / 1000),
          time_until_expiry: session?.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 'N/A'
        });
        
        // Melhor tratamento de refresh de token
        if (event === 'TOKEN_REFRESHED') {
          console.log('✅ useAuth.ts:192 Token refreshed successfully:', {
            expires_at: session?.expires_at,
            current_time: Math.floor(Date.now() / 1000),
            time_until_expiry: session?.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 'N/A'
          });
        }
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('❌ useAuth.ts:200 Processando logout/sem sessão...');
          if (mounted) {
            setUser(null);
          }
          // Redirecionar para auth apenas se não estiver já lá
          if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
            console.log('➡️ useAuth.ts:206 Redirecionando para /auth');
            navigate('/auth', { replace: true });
          }
          return;
        }
        
        if (session?.user) {
          console.log('✅ useAuth.ts:190 Processando evento com sessão válida...');
          
          // Verificar se o token já está expirado
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at <= now) {
            console.log('⚠️ useAuth.ts:195 Token já expirado no evento:', {
              expires_at: session.expires_at,
              current_time: now,
              difference: now - session.expires_at
            });
            return;
          }
          
          // Buscar dados do usuário quando logar
          console.log('👤 useAuth.ts:203 Buscando dados do usuário...');
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, role')
            .eq('user_id', session.user.id)
            .single();

          const userProfile = userData || {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            role: 'student'
          };

          console.log('👤 useAuth.ts:216 Perfil do usuário:', userProfile);
          
          if (mounted) {
            setUser(userProfile);
          }

          // Redirecionamento automático após login
          if (event === 'SIGNED_IN') {
            console.log('🔄 useAuth.ts:225 Login detectado, redirecionando...');
            const role = userProfile.role || 'student';
            
            // Aguardar um pequeno delay para garantir que o estado seja atualizado
            setTimeout(() => {
              if (role === 'admin' || role === 'instructor') {
                console.log('➡️ useAuth.ts:231 Redirecionando para /admin');
                navigate('/admin', { replace: true });
              } else {
                console.log('➡️ useAuth.ts:234 Redirecionando para /app');
                navigate('/app', { replace: true });
              }
            }, 100);
          }
        } else {
          console.log('❌ useAuth.ts:240 Processando evento sem sessão...');
          if (mounted) {
            setUser(null);
          }
          // Redirecionar para auth apenas se não estiver já lá
          if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
            console.log('➡️ useAuth.ts:246 Redirecionando para /auth');
            navigate('/auth', { replace: true });
          }
        }
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 useAuth.ts:252 Token refreshed:', {
            expires_at: session?.expires_at,
            current_time: Math.floor(Date.now() / 1000),
            time_until_expiry: session?.expires_at ? session.expires_at - Math.floor(Date.now() / 1000) : 'N/A'
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('❌ useAuth.ts:258 Processando SIGNED_OUT...');
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
    signIn,
    signUp,
    resetPassword,
    updatePassword
  };
}