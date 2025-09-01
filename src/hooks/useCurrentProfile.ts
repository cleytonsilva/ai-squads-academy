import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CurrentProfile = {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: "student" | "admin" | "instructor";
  xp: number;
};

// Debounce utility para evitar chamadas múltiplas
function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

export function useCurrentProfile() {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Debug logs para rastrear carregamentos
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useCurrentProfile] ${message}`, data || '');
    }
  };

  const load = useCallback(async () => {
    // Evitar chamadas simultâneas
    if (loadingRef.current) {
      debugLog('Load já em andamento, ignorando chamada duplicada');
      return;
    }
    
    loadingRef.current = true;
    debugLog('Iniciando carregamento do perfil');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        debugLog('Nenhuma sessão encontrada');
        if (mountedRef.current) {
          setProfile(null);
        }
        return;
      }
      
      debugLog('Buscando perfil para usuário:', session.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("id,user_id,display_name,avatar_url,role,xp")
        .eq("user_id", session.user.id)
        .maybeSingle();
      
      if (mountedRef.current) {
        setProfile(data as any);
        debugLog('Perfil carregado:', data);
      }
    } catch (error) {
      debugLog('Erro ao carregar perfil:', error);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced load para evitar chamadas múltiplas rápidas
  const debouncedLoad = useDebounce(load, 100);

  useEffect(() => {
    mountedRef.current = true;
    debugLog('Hook montado, iniciando carregamento inicial');
    
    // Carregamento inicial
    load();
    
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      debugLog('Auth state change:', { event, hasSession: !!session?.user });
      
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setProfile(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Usar debounced load para evitar chamadas múltiplas
        debouncedLoad();
      }
    });
    
    return () => {
      debugLog('Hook desmontado');
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [load, debouncedLoad]);

  const refetch = useCallback(async () => {
    debugLog('Refetch solicitado');
    setLoading(true);
    await load();
  }, [load]);

  return { profile, loading, refetch } as const;
}
