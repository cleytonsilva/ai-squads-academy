import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Interface para resultados do diagnóstico
 */
export interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

/**
 * Interface para relatório completo de diagnóstico
 */
export interface DiagnosticReport {
  overall: 'healthy' | 'issues' | 'critical';
  results: DiagnosticResult[];
  summary: {
    total: number;
    success: number;
    warnings: number;
    errors: number;
  };
  recommendations: string[];
}

/**
 * Classe para diagnóstico do sistema de autenticação
 */
export class AuthDiagnostic {
  private results: DiagnosticResult[] = [];
  private recommendations: string[] = [];

  /**
   * Adiciona um resultado de teste
   */
  private addResult(test: string, status: DiagnosticResult['status'], message: string, details?: any) {
    this.results.push({
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Adiciona uma recomendação
   */
  private addRecommendation(recommendation: string) {
    this.recommendations.push(recommendation);
  }

  /**
   * Testa a conectividade básica com o Supabase
   */
  async testSupabaseConnection(): Promise<void> {
    try {
      console.log('🔍 Testando conectividade com Supabase...');
      
      // Verificar variáveis de ambiente
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        this.addResult(
          'Variáveis de Ambiente',
          'error',
          'Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas',
          { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey }
        );
        this.addRecommendation('Configure as variáveis de ambiente do Supabase no arquivo .env');
        return;
      }

      this.addResult(
        'Variáveis de Ambiente',
        'success',
        'Variáveis de ambiente do Supabase configuradas corretamente'
      );

      // Testar conexão com o banco
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        this.addResult(
          'Conexão com Banco',
          'error',
          `Erro ao conectar com o banco: ${error.message}`,
          error
        );
        this.addRecommendation('Verifique se o projeto Supabase está ativo e as credenciais estão corretas');
      } else {
        this.addResult(
          'Conexão com Banco',
          'success',
          'Conexão com banco de dados estabelecida com sucesso'
        );
      }
    } catch (error: any) {
      this.addResult(
        'Conectividade Supabase',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Testa a tabela profiles e suas políticas
   */
  async testProfilesTable(): Promise<void> {
    try {
      console.log('🔍 Testando tabela profiles...');
      
      // Verificar se a tabela existe
      const { data, error } = await supabase.from('profiles').select('*').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          this.addResult(
            'Tabela Profiles',
            'error',
            'Tabela profiles não existe ou não está acessível',
            error
          );
          this.addRecommendation('Crie a tabela profiles ou verifique as permissões de acesso');
        } else {
          this.addResult(
            'Tabela Profiles',
            'error',
            `Erro ao acessar tabela profiles: ${error.message}`,
            error
          );
        }
      } else {
        this.addResult(
          'Tabela Profiles',
          'success',
          'Tabela profiles acessível'
        );
      }

      // Testar políticas RLS
      const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_policies', {
        table_name: 'profiles'
      }).catch(() => ({ data: null, error: { message: 'Função check_rls_policies não encontrada' } }));

      if (rlsError) {
        this.addResult(
          'Políticas RLS',
          'warning',
          'Não foi possível verificar políticas RLS automaticamente',
          rlsError
        );
        this.addRecommendation('Verifique manualmente se as políticas RLS estão configuradas corretamente');
      }
    } catch (error: any) {
      this.addResult(
        'Tabela Profiles',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Testa as funções de autenticação
   */
  async testAuthFunctions(): Promise<void> {
    try {
      console.log('🔍 Testando funções de autenticação...');
      
      // Verificar sessão atual
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        this.addResult(
          'Verificação de Sessão',
          'error',
          `Erro ao verificar sessão: ${sessionError.message}`,
          sessionError
        );
      } else {
        this.addResult(
          'Verificação de Sessão',
          'success',
          `Função de verificação de sessão funcionando. Usuário ${sessionData.session ? 'logado' : 'não logado'}`
        );
      }

      // Testar configuração de auth
      const authConfig = supabase.auth.getUser();
      
      authConfig.then(({ data, error }) => {
        if (error && error.message !== 'Invalid JWT') {
          this.addResult(
            'Configuração Auth',
            'error',
            `Erro na configuração de auth: ${error.message}`,
            error
          );
        } else {
          this.addResult(
            'Configuração Auth',
            'success',
            'Configuração de autenticação funcionando corretamente'
          );
        }
      }).catch((error) => {
        this.addResult(
          'Configuração Auth',
          'error',
          `Erro inesperado na configuração: ${error.message}`,
          error
        );
      });

    } catch (error: any) {
      this.addResult(
        'Funções de Auth',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Testa o processo de login com credenciais de teste
   */
  async testLoginProcess(email?: string, password?: string): Promise<void> {
    if (!email || !password) {
      this.addResult(
        'Teste de Login',
        'warning',
        'Credenciais de teste não fornecidas - pulando teste de login'
      );
      return;
    }

    try {
      console.log('🔍 Testando processo de login...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        this.addResult(
          'Processo de Login',
          'error',
          `Erro no login: ${error.message}`,
          error
        );
        
        if (error.message.includes('Invalid login credentials')) {
          this.addRecommendation('Verifique se o usuário existe e a senha está correta');
        } else if (error.message.includes('Email not confirmed')) {
          this.addRecommendation('Confirme o email do usuário antes de tentar fazer login');
        }
      } else {
        this.addResult(
          'Processo de Login',
          'success',
          'Login realizado com sucesso'
        );
        
        // Fazer logout para não afetar outros testes
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (logoutError) {
      console.warn('Erro no logout após diagnóstico:', logoutError);
    }
      }
    } catch (error: any) {
      this.addResult(
        'Processo de Login',
        'error',
        `Erro inesperado no login: ${error.message}`,
        error
      );
    }
  }

  /**
   * Verifica configurações de localStorage e sessionStorage
   */
  testStorageConfiguration(): void {
    try {
      console.log('🔍 Testando configuração de storage...');
      
      // Testar localStorage
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        this.addResult(
          'LocalStorage',
          'success',
          'LocalStorage funcionando corretamente'
        );
      } catch (error) {
        this.addResult(
          'LocalStorage',
          'error',
          'LocalStorage não está disponível ou bloqueado',
          error
        );
        this.addRecommendation('Verifique se o localStorage não está bloqueado pelo navegador');
      }

      // Verificar se há dados de sessão corrompidos
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      
      if (supabaseKeys.length > 0) {
        this.addResult(
          'Dados de Sessão',
          'warning',
          `Encontrados ${supabaseKeys.length} itens de sessão no localStorage`,
          supabaseKeys
        );
        this.addRecommendation('Considere limpar dados de sessão antigos se houver problemas de login');
      } else {
        this.addResult(
          'Dados de Sessão',
          'success',
          'Nenhum dado de sessão antigo encontrado'
        );
      }
    } catch (error: any) {
      this.addResult(
        'Configuração Storage',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Executa todos os testes de diagnóstico
   */
  async runFullDiagnostic(testCredentials?: { email: string; password: string }): Promise<DiagnosticReport> {
    console.log('🚀 Iniciando diagnóstico completo do sistema de autenticação...');
    
    this.results = [];
    this.recommendations = [];

    // Executar todos os testes
    await this.testSupabaseConnection();
    await this.testProfilesTable();
    await this.testAuthFunctions();
    this.testStorageConfiguration();
    
    if (testCredentials) {
      await this.testLoginProcess(testCredentials.email, testCredentials.password);
    }

    // Calcular estatísticas
    const summary = {
      total: this.results.length,
      success: this.results.filter(r => r.status === 'success').length,
      warnings: this.results.filter(r => r.status === 'warning').length,
      errors: this.results.filter(r => r.status === 'error').length
    };

    // Determinar status geral
    let overall: DiagnosticReport['overall'] = 'healthy';
    if (summary.errors > 0) {
      overall = summary.errors >= 3 ? 'critical' : 'issues';
    } else if (summary.warnings > 2) {
      overall = 'issues';
    }

    const report: DiagnosticReport = {
      overall,
      results: this.results,
      summary,
      recommendations: this.recommendations
    };

    console.log('✅ Diagnóstico concluído:', report);
    return report;
  }

  /**
   * Limpa dados de sessão corrompidos
   */
  static clearSessionData(): void {
    try {
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') || key.includes('supabase')
      );
      
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      sessionStorage.clear();
      
      console.log('🧹 Dados de sessão limpos com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar dados de sessão:', error);
    }
  }

  /**
   * Gera relatório em formato texto
   */
  static generateTextReport(report: DiagnosticReport): string {
    let text = `RELATÓRIO DE DIAGNÓSTICO - SISTEMA DE AUTENTICAÇÃO\n`;
    text += `================================================\n\n`;
    text += `Status Geral: ${report.overall.toUpperCase()}\n`;
    text += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    text += `RESUMO:\n`;
    text += `- Total de testes: ${report.summary.total}\n`;
    text += `- Sucessos: ${report.summary.success}\n`;
    text += `- Avisos: ${report.summary.warnings}\n`;
    text += `- Erros: ${report.summary.errors}\n\n`;
    
    text += `RESULTADOS DETALHADOS:\n`;
    text += `======================\n`;
    
    report.results.forEach((result, index) => {
      const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
      text += `${index + 1}. ${icon} ${result.test}\n`;
      text += `   Status: ${result.status.toUpperCase()}\n`;
      text += `   Mensagem: ${result.message}\n`;
      if (result.details) {
        text += `   Detalhes: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      text += `\n`;
    });
    
    if (report.recommendations.length > 0) {
      text += `RECOMENDAÇÕES:\n`;
      text += `==============\n`;
      report.recommendations.forEach((rec, index) => {
        text += `${index + 1}. ${rec}\n`;
      });
    }
    
    return text;
  }
}

/**
 * Função utilitária para executar diagnóstico rápido
 */
export async function quickAuthDiagnostic(): Promise<DiagnosticReport> {
  const diagnostic = new AuthDiagnostic();
  return await diagnostic.runFullDiagnostic();
}

/**
 * Função utilitária para executar diagnóstico com credenciais de teste
 */
export async function fullAuthDiagnostic(email: string, password: string): Promise<DiagnosticReport> {
  const diagnostic = new AuthDiagnostic();
  return await diagnostic.runFullDiagnostic({ email, password });
}