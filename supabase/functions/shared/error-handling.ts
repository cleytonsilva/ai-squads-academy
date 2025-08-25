/**
 * Sistema robusto de tratamento de erros e logging
 * Para monitoramento completo do fluxo de geração de imagens
 */

/**
 * Tipos de erro do sistema
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  EXTERNAL_API = 'EXTERNAL_API',
  STORAGE = 'STORAGE',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Interface para erro estruturado
 */
export interface StructuredError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: string;
  context?: {
    userId?: string;
    courseId?: string;
    predictionId?: string;
    function?: string;
    step?: string;
  };
  originalError?: any;
}

/**
 * Interface para resultado de operação
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: StructuredError;
}

/**
 * Classe para tratamento centralizado de erros
 */
export class ErrorHandler {
  private static logError(error: StructuredError): void {
    console.error(`[${error.type}] ${error.message}`, {
      timestamp: error.timestamp,
      context: error.context,
      details: error.details,
      originalError: error.originalError
    });
  }

  /**
   * Cria erro estruturado
   */
  static createError(
    type: ErrorType,
    message: string,
    context?: StructuredError['context'],
    details?: any,
    originalError?: any
  ): StructuredError {
    const error: StructuredError = {
      type,
      message,
      timestamp: new Date().toISOString(),
      context,
      details,
      originalError
    };

    this.logError(error);
    return error;
  }

  /**
   * Trata erro de autenticação
   */
  static handleAuthError(
    originalError: any,
    context?: StructuredError['context']
  ): StructuredError {
    let message = 'Erro de autenticação';
    
    if (originalError?.message?.includes('JWT')) {
      message = 'Token de autenticação inválido ou expirado';
    } else if (originalError?.message?.includes('User not found')) {
      message = 'Usuário não encontrado';
    }

    return this.createError(
      ErrorType.AUTHENTICATION,
      message,
      context,
      { statusCode: 401 },
      originalError
    );
  }

  /**
   * Trata erro de autorização
   */
  static handleAuthorizationError(
    requiredRole: string,
    userRole?: string,
    context?: StructuredError['context']
  ): StructuredError {
    return this.createError(
      ErrorType.AUTHORIZATION,
      `Acesso negado. Role necessário: ${requiredRole}. Role atual: ${userRole || 'não definido'}`,
      context,
      { statusCode: 403, requiredRole, userRole }
    );
  }

  /**
   * Trata erro de validação
   */
  static handleValidationError(
    field: string,
    value: any,
    context?: StructuredError['context']
  ): StructuredError {
    return this.createError(
      ErrorType.VALIDATION,
      `Valor inválido para ${field}: ${value}`,
      context,
      { statusCode: 400, field, value }
    );
  }

  /**
   * Trata erro de API externa
   */
  static handleExternalApiError(
    apiName: string,
    originalError: any,
    context?: StructuredError['context']
  ): StructuredError {
    let message = `Erro na API ${apiName}`;
    
    if (originalError?.status) {
      message += ` (${originalError.status})`;
    }
    
    if (originalError?.message) {
      message += `: ${originalError.message}`;
    }

    return this.createError(
      ErrorType.EXTERNAL_API,
      message,
      context,
      { apiName, statusCode: originalError?.status },
      originalError
    );
  }

  /**
   * Trata erro de storage
   */
  static handleStorageError(
    operation: string,
    originalError: any,
    context?: StructuredError['context']
  ): StructuredError {
    let message = `Erro no storage durante ${operation}`;
    
    if (originalError?.message?.includes('Bucket not found')) {
      message = 'Bucket não encontrado. Verifique a configuração do Storage.';
    } else if (originalError?.message?.includes('Policy')) {
      message = 'Sem permissão para acessar o Storage. Verifique as políticas RLS.';
    } else if (originalError?.message?.includes('File size')) {
      message = 'Arquivo muito grande para upload.';
    }

    return this.createError(
      ErrorType.STORAGE,
      message,
      context,
      { operation },
      originalError
    );
  }

  /**
   * Trata erro de banco de dados
   */
  static handleDatabaseError(
    operation: string,
    originalError: any,
    context?: StructuredError['context']
  ): StructuredError {
    let message = `Erro no banco de dados durante ${operation}`;
    
    if (originalError?.code === '23505') {
      message = 'Registro duplicado';
    } else if (originalError?.code === '23503') {
      message = 'Violação de chave estrangeira';
    } else if (originalError?.message?.includes('RLS')) {
      message = 'Sem permissão para acessar os dados. Verifique as políticas RLS.';
    }

    return this.createError(
      ErrorType.DATABASE,
      message,
      context,
      { operation, code: originalError?.code },
      originalError
    );
  }

  /**
   * Trata erro de rede
   */
  static handleNetworkError(
    originalError: any,
    context?: StructuredError['context']
  ): StructuredError {
    let message = 'Erro de conexão de rede';
    
    if (originalError?.message?.includes('timeout')) {
      message = 'Timeout na conexão';
    } else if (originalError?.message?.includes('ECONNREFUSED')) {
      message = 'Conexão recusada pelo servidor';
    }

    return this.createError(
      ErrorType.NETWORK,
      message,
      context,
      undefined,
      originalError
    );
  }

  /**
   * Wrapper para execução segura de operações
   */
  static async safeExecute<T>(
    operation: () => Promise<T>,
    context?: StructuredError['context'],
    operationName?: string
  ): Promise<OperationResult<T>> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error: any) {
      const structuredError = this.categorizeError(error, context, operationName);
      return { success: false, error: structuredError };
    }
  }

  /**
   * Categoriza erro automaticamente
   */
  private static categorizeError(
    error: any,
    context?: StructuredError['context'],
    operationName?: string
  ): StructuredError {
    // Erro já estruturado
    if (error.type && error.message && error.timestamp) {
      return error;
    }

    // Categorização automática baseada no erro
    if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
      return this.handleAuthError(error, context);
    }
    
    if (error?.message?.includes('permission') || error?.message?.includes('authorized')) {
      return this.handleAuthorizationError('unknown', undefined, context);
    }
    
    if (error?.message?.includes('Bucket') || error?.message?.includes('storage')) {
      return this.handleStorageError(operationName || 'unknown', error, context);
    }
    
    if (error?.code || error?.message?.includes('database') || error?.message?.includes('RLS')) {
      return this.handleDatabaseError(operationName || 'unknown', error, context);
    }
    
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return this.handleNetworkError(error, context);
    }

    // Erro genérico
    return this.createError(
      ErrorType.UNKNOWN,
      error?.message || 'Erro desconhecido',
      context,
      undefined,
      error
    );
  }
}

/**
 * Utilitário para logging de progresso
 */
export class ProgressLogger {
  private context: StructuredError['context'];
  private startTime: number;

  constructor(context: StructuredError['context']) {
    this.context = context;
    this.startTime = Date.now();
  }

  log(step: string, details?: any): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`[PROGRESS] ${step}`, {
      context: this.context,
      elapsed: `${elapsed}ms`,
      details
    });
  }

  error(step: string, error: any): void {
    const elapsed = Date.now() - this.startTime;
    console.error(`[PROGRESS_ERROR] ${step}`, {
      context: this.context,
      elapsed: `${elapsed}ms`,
      error
    });
  }

  complete(result?: any): void {
    const elapsed = Date.now() - this.startTime;
    console.log(`[PROGRESS_COMPLETE]`, {
      context: this.context,
      totalTime: `${elapsed}ms`,
      result
    });
  }
}