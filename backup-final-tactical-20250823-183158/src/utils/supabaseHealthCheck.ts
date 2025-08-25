import { supabase } from '@/integrations/supabase/client';

/**
 * Interface para resultado de verificação de saúde
 */
export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Classe para verificação de saúde do Supabase
 */
export class SupabaseHealthCheck {
  private results: HealthCheckResult[] = [];

  /**
   * Adiciona resultado de verificação
   */
  private addResult(
    component: string, 
    status: HealthCheckResult['status'], 
    message: string, 
    details?: any
  ) {
    this.results.push({
      component,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Verifica configuração básica
   */
  async checkConfiguration(): Promise<void> {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!url || !key) {
        this.addResult(
          'Configuration',
          'unhealthy',
          'Variáveis de ambiente não configuradas',
          { hasUrl: !!url, hasKey: !!key }
        );
        return;
      }

      // Verificar formato da URL
      try {
        new URL(url);
        this.addResult(
          'Configuration',
          'healthy',
          'Configuração básica válida'
        );
      } catch {
        this.addResult(
          'Configuration',
          'unhealthy',
          'URL do Supabase inválida',
          { url }
        );
      }
    } catch (error: any) {
      this.addResult(
        'Configuration',
        'unhealthy',
        `Erro na verificação: ${error.message}`,
        error
      );
    }
  }

  /**
   * Verifica conectividade com o banco
   */
  async checkDatabaseConnection(): Promise<void> {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;

      if (error) {
        if (error.code === 'PGRST116') {
          this.addResult(
            'Database',
            'unhealthy',
            'Tabela profiles não encontrada ou sem permissão',
            { error: error.message, code: error.code }
          );
        } else if (error.code === '42501') {
          this.addResult(
            'Database',
            'degraded',
            'Problema de permissões RLS',
            { error: error.message, code: error.code }
          );
        } else {
          this.addResult(
            'Database',
            'unhealthy',
            `Erro de conexão: ${error.message}`,
            { error: error.message, code: error.code }
          );
        }
      } else {
        const status = responseTime > 2000 ? 'degraded' : 'healthy';
        this.addResult(
          'Database',
          status,
          `Conexão estabelecida (${responseTime}ms)`,
          { responseTime, hasData: !!data }
        );
      }
    } catch (error: any) {
      this.addResult(
        'Database',
        'unhealthy',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Verifica serviço de autenticação
   */
  async checkAuthService(): Promise<void> {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;

      if (error) {
        this.addResult(
          'Auth Service',
          'unhealthy',
          `Erro no serviço de auth: ${error.message}`,
          error
        );
      } else {
        const status = responseTime > 1000 ? 'degraded' : 'healthy';
        this.addResult(
          'Auth Service',
          status,
          `Serviço de auth funcionando (${responseTime}ms)`,
          { responseTime, hasSession: !!data.session }
        );
      }
    } catch (error: any) {
      this.addResult(
        'Auth Service',
        'unhealthy',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Verifica políticas RLS
   */
  async checkRLSPolicies(): Promise<void> {
    try {
      // Tentar acessar profiles sem autenticação
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42501' || error.message.includes('permission denied')) {
          this.addResult(
            'RLS Policies',
            'healthy',
            'RLS está ativo e bloqueando acesso não autorizado'
          );
        } else {
          this.addResult(
            'RLS Policies',
            'degraded',
            `Erro inesperado ao verificar RLS: ${error.message}`,
            error
          );
        }
      } else {
        this.addResult(
          'RLS Policies',
          'degraded',
          'RLS pode não estar configurado corretamente - acesso permitido sem auth',
          { dataReturned: !!data }
        );
      }
    } catch (error: any) {
      this.addResult(
        'RLS Policies',
        'unhealthy',
        `Erro ao verificar RLS: ${error.message}`,
        error
      );
    }
  }

  /**
   * Verifica storage local
   */
  checkLocalStorage(): void {
    try {
      // Testar localStorage
      const testKey = 'supabase_health_check';
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved === 'test') {
        this.addResult(
          'Local Storage',
          'healthy',
          'LocalStorage funcionando corretamente'
        );
      } else {
        this.addResult(
          'Local Storage',
          'degraded',
          'LocalStorage com problemas de leitura/escrita'
        );
      }

      // Verificar dados de sessão existentes
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );

      if (supabaseKeys.length > 0) {
        this.addResult(
          'Session Data',
          'healthy',
          `${supabaseKeys.length} chaves de sessão encontradas`,
          { keys: supabaseKeys }
        );
      } else {
        this.addResult(
          'Session Data',
          'healthy',
          'Nenhum dado de sessão encontrado'
        );
      }
    } catch (error: any) {
      this.addResult(
        'Local Storage',
        'unhealthy',
        `Erro no localStorage: ${error.message}`,
        error
      );
    }
  }

  /**
   * Executa verificação completa
   */
  async runFullHealthCheck(): Promise<HealthCheckResult[]> {
    console.log('🏥 Iniciando verificação de saúde do Supabase...');
    
    this.results = [];

    await this.checkConfiguration();
    await this.checkDatabaseConnection();
    await this.checkAuthService();
    await this.checkRLSPolicies();
    this.checkLocalStorage();

    console.log('✅ Verificação de saúde concluída:', this.results);
    return this.results;
  }

  /**
   * Gera relatório de saúde
   */
  static generateHealthReport(results: HealthCheckResult[]): string {
    const healthy = results.filter(r => r.status === 'healthy').length;
    const degraded = results.filter(r => r.status === 'degraded').length;
    const unhealthy = results.filter(r => r.status === 'unhealthy').length;
    
    let report = `RELATÓRIO DE SAÚDE - SUPABASE\n`;
    report += `===============================\n\n`;
    report += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    report += `RESUMO:\n`;
    report += `- Componentes saudáveis: ${healthy}\n`;
    report += `- Componentes degradados: ${degraded}\n`;
    report += `- Componentes com falha: ${unhealthy}\n\n`;
    
    report += `DETALHES:\n`;
    report += `=========\n`;
    
    results.forEach((result, index) => {
      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'degraded' ? '⚠️' : '❌';
      
      report += `${index + 1}. ${icon} ${result.component}\n`;
      report += `   Status: ${result.status.toUpperCase()}\n`;
      report += `   Mensagem: ${result.message}\n`;
      
      if (result.details) {
        report += `   Detalhes: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      
      report += `\n`;
    });
    
    return report;
  }
}

/**
 * Função utilitária para verificação rápida
 */
export async function quickHealthCheck(): Promise<HealthCheckResult[]> {
  const healthCheck = new SupabaseHealthCheck();
  return await healthCheck.runFullHealthCheck();
}

/**
 * Função para testar login específico
 */
export async function testLogin(email: string, password: string): Promise<HealthCheckResult> {
  try {
    const startTime = Date.now();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        component: 'Login Test',
        status: 'unhealthy',
        message: `Falha no login: ${error.message}`,
        details: { error: error.message, responseTime },
        timestamp: new Date().toISOString()
      };
    }

    // Fazer logout imediatamente com tratamento de erro
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (logoutError) {
      console.warn('Erro no logout após teste:', logoutError);
    }

    return {
      component: 'Login Test',
      status: 'healthy',
      message: `Login bem-sucedido (${responseTime}ms)`,
      details: { responseTime, userId: data.user?.id },
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      component: 'Login Test',
      status: 'unhealthy',
      message: `Erro inesperado: ${error.message}`,
      details: error,
      timestamp: new Date().toISOString()
    };
  }
}