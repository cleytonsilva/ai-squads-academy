import { PostgrestError } from '@supabase/supabase-js';
import { toast } from 'sonner';

/**
 * Tipos de erro comuns do Supabase
 */
export enum SupabaseErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface para resultado de operação com Supabase
 */
export interface SupabaseOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorType?: SupabaseErrorType;
  shouldRetry?: boolean;
}

/**
 * Classifica o tipo de erro baseado na mensagem e código
 */
export function classifySupabaseError(error: unknown): SupabaseErrorType {
  if (!error) return SupabaseErrorType.UNKNOWN;
  
  const errorObj = error as { message?: string; code?: string };
  const message = errorObj.message?.toLowerCase() || '';
  const code = errorObj.code;
  
  // Erros de autenticação
  if (
    message.includes('jwt') ||
    message.includes('token') ||
    message.includes('unauthorized') ||
    message.includes('not authenticated') ||
    code === 'PGRST301'
  ) {
    return SupabaseErrorType.AUTHENTICATION;
  }
  
  // Erros de autorização/permissão
  if (
    message.includes('permission') ||
    message.includes('access denied') ||
    message.includes('forbidden') ||
    message.includes('rls') ||
    code === 'PGRST116'
  ) {
    return SupabaseErrorType.AUTHORIZATION;
  }
  
  // Erros de rede/conectividade
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch')
  ) {
    return SupabaseErrorType.NETWORK;
  }
  
  // Erros de validação
  if (
    message.includes('validation') ||
    message.includes('constraint') ||
    message.includes('invalid') ||
    code?.startsWith('23') // PostgreSQL constraint violations
  ) {
    return SupabaseErrorType.VALIDATION;
  }
  
  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    code === '429'
  ) {
    return SupabaseErrorType.RATE_LIMIT;
  }
  
  // Erros de servidor
  if (
    message.includes('internal server error') ||
    message.includes('500') ||
    code?.startsWith('5')
  ) {
    return SupabaseErrorType.SERVER_ERROR;
  }
  
  return SupabaseErrorType.UNKNOWN;
}

/**
 * Determina se um erro deve ser retentado
 */
export function shouldRetryError(errorType: SupabaseErrorType): boolean {
  switch (errorType) {
    case SupabaseErrorType.NETWORK:
    case SupabaseErrorType.RATE_LIMIT:
    case SupabaseErrorType.SERVER_ERROR:
      return true;
    case SupabaseErrorType.AUTHENTICATION:
    case SupabaseErrorType.AUTHORIZATION:
    case SupabaseErrorType.VALIDATION:
    case SupabaseErrorType.UNKNOWN:
    default:
      return false;
  }
}

/**
 * Gera mensagem de erro amigável para o usuário
 */
export function getErrorMessage(errorType: SupabaseErrorType, originalError?: Error): string {
  switch (errorType) {
    case SupabaseErrorType.AUTHENTICATION:
      return 'Sessão expirada. Por favor, faça login novamente.';
    case SupabaseErrorType.AUTHORIZATION:
      return 'Você não tem permissão para realizar esta ação.';
    case SupabaseErrorType.NETWORK:
      return 'Problema de conexão. Verifique sua internet e tente novamente.';
    case SupabaseErrorType.VALIDATION:
      return 'Dados inválidos. Verifique as informações e tente novamente.';
    case SupabaseErrorType.RATE_LIMIT:
      return 'Muitas tentativas. Aguarde um momento e tente novamente.';
    case SupabaseErrorType.SERVER_ERROR:
      return 'Erro interno do servidor. Tente novamente em alguns minutos.';
    case SupabaseErrorType.UNKNOWN:
    default:
      return (originalError as Error)?.message || 'Erro inesperado. Tente novamente.';
  }
}

/**
 * Manipula erros do Supabase de forma consistente
 */
export function handleSupabaseError(error: unknown, showToast = true): SupabaseOperationResult {
  console.error('[Supabase Error]', error);
  
  const errorType = classifySupabaseError(error);
  const shouldRetry = shouldRetryError(errorType);
  const message = getErrorMessage(errorType, error);
  
  if (showToast) {
    toast.error('Erro', {
      description: message
    });
  }
  
  return {
    success: false,
    error: message,
    errorType,
    shouldRetry
  };
}

/**
 * Executa operação com retry automático
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  autoLog = true
): Promise<SupabaseOperationResult<T>> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      lastError = error;
      const errorType = classifySupabaseError(error);
      
      // Se não deve tentar novamente, falha imediatamente
      if (!shouldRetryError(errorType)) {
        break;
      }
      
      // Se não é a última tentativa, aguarda antes de tentar novamente
      if (attempt < maxRetries) {
        console.warn(`[Retry] Tentativa ${attempt} falhou, tentando novamente em ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Backoff exponencial
      }
    }
  }
  
  // Quando autoLog for false, não use handleSupabaseError para evitar logs no console/toast
  if (!autoLog) {
    const errorType = classifySupabaseError(lastError);
    return {
      success: false,
      error: getErrorMessage(errorType, lastError),
      errorType,
      shouldRetry: shouldRetryError(errorType)
    };
  }
  
  return handleSupabaseError(lastError, true);
}

/**
 * Wrapper para operações do Supabase com tratamento de erro consistente
 */
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T; error: PostgrestError | null }>,
  showToast = true
): Promise<SupabaseOperationResult<T>> {
  try {
    const { data, error } = await operation();
    
    if (error) {
      return handleSupabaseError(error, showToast);
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    return handleSupabaseError(error, showToast);
  }
}

/**
 * Verifica se o usuário está autenticado e tem permissão
 */
export async function checkUserPermissions(
  supabase: any,
  requiredRoles: string[] = ['admin', 'instructor']
): Promise<SupabaseOperationResult<{ userId: string; role: string }>> {
  try {
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
        errorType: SupabaseErrorType.AUTHENTICATION,
        shouldRetry: false
      };
    }

    // Verificar perfil/roles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      return handleSupabaseError(profileError, false);
    }

    if (!profile || !requiredRoles.includes(profile.role)) {
      return {
        success: false,
        error: 'Permissões insuficientes',
        errorType: SupabaseErrorType.AUTHORIZATION,
        shouldRetry: false
      };
    }

    return {
      success: true,
      data: { userId: user.id, role: profile.role }
    };
  } catch (error) {
    return handleSupabaseError(error, false);
  }
}