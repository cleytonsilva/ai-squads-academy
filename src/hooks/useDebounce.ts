import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Hook para implementar debounce em funções
 * Útil para evitar chamadas excessivas de salvamento e melhorar performance
 * 
 * @param callback - Função a ser executada com debounce
 * @param delay - Delay em milissegundos para o debounce
 * @returns Função com debounce aplicado
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Configurar novo timeout
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

/**
 * Hook para debounce com cancelamento manual
 * Permite cancelar o debounce antes que seja executado
 * 
 * @param callback - Função a ser executada com debounce
 * @param delay - Delay em milissegundos para o debounce
 * @returns Objeto com função debouncada e função de cancelamento
 */
export function useDebounceWithCancel<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): {
  debouncedCallback: T;
  cancel: () => void;
  isPending: () => boolean;
} {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  }, []);
  
  const isPending = useCallback(() => {
    return timeoutRef.current !== undefined;
  }, []);
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    // Limpar timeout anterior se existir
    cancel();
    
    // Configurar novo timeout
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = undefined;
      callback(...args);
    }, delay);
  }, [callback, delay, cancel]) as T;
  
  return {
    debouncedCallback,
    cancel,
    isPending
  };
}

/**
 * Hook para debounce de valores (não funções)
 * Útil para debounce de inputs e estados
 * 
 * @param value - Valor a ser debouncado
 * @param delay - Delay em milissegundos para o debounce
 * @returns Valor debouncado
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Hook para throttle (limitação de frequência)
 * Diferente do debounce, executa a função em intervalos regulares
 * 
 * @param callback - Função a ser executada com throttle
 * @param delay - Intervalo em milissegundos entre execuções
 * @returns Função com throttle aplicado
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastExecutedRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutedRef.current;
    
    if (timeSinceLastExecution >= delay) {
      // Executar imediatamente se passou tempo suficiente
      lastExecutedRef.current = now;
      callback(...args);
    } else {
      // Agendar execução para quando o delay for atingido
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastExecution);
    }
  }, [callback, delay]) as T;
}

/**
 * Hook para debounce específico para salvamento de módulos
 * Inclui logs e tratamento de erros específicos
 * 
 * @param saveFunction - Função de salvamento a ser debouncada
 * @param delay - Delay em milissegundos (padrão: 2000ms)
 * @returns Função de salvamento com debounce e logs
 */
export function useModuleSaveDebounce(
  saveFunction: () => Promise<void>,
  delay: number = 2000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const debouncedSave = useCallback(async () => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Configurar novo timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        console.log('💾 useModuleSaveDebounce: Executando salvamento debouncado...');
        
        await saveFunction();
        
        setLastSaveTime(new Date());
        console.log('✅ useModuleSaveDebounce: Salvamento concluído com sucesso');
      } catch (error) {
        console.error('❌ useModuleSaveDebounce: Erro no salvamento:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    }, delay);
  }, [saveFunction, delay]);
  
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log('🚫 useModuleSaveDebounce: Salvamento cancelado');
    }
  }, []);
  
  const forceSave = useCallback(async () => {
    // Cancelar debounce pendente
    cancelSave();
    
    try {
      setIsSaving(true);
      console.log('⚡ useModuleSaveDebounce: Executando salvamento forçado...');
      
      await saveFunction();
      
      setLastSaveTime(new Date());
      console.log('✅ useModuleSaveDebounce: Salvamento forçado concluído');
    } catch (error) {
      console.error('❌ useModuleSaveDebounce: Erro no salvamento forçado:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveFunction, cancelSave]);
  
  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return {
    debouncedSave,
    forceSave,
    cancelSave,
    isSaving,
    lastSaveTime,
    isPending: () => timeoutRef.current !== undefined
  };
}