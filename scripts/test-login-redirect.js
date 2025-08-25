/**
 * Script para testar login e redirecionamento do usuário admin
 * Simula o processo de login e verifica se o redirecionamento está funcionando
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TARGET_EMAIL = 'cleyton7silva@gmail.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   Necessário: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Cliente com anon key (como no frontend)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class LoginRedirectTester {
  constructor() {
    this.results = [];
  }

  addResult(test, status, message, data = null) {
    const result = { test, status, message, data, timestamp: new Date().toISOString() };
    this.results.push(result);
    
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    console.log(`${icons[status]} ${test}: ${message}`);
    
    if (data) {
      console.log(`   Dados:`, JSON.stringify(data, null, 2));
    }
  }

  /**
   * Simula o processo de verificação de sessão (como no useAuth)
   */
  async simulateSessionCheck() {
    try {
      console.log('\n🔍 Simulando verificação de sessão...');
      
      // Verificar se há sessão ativa
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addResult(
          'Session Check',
          'error',
          `Erro ao obter sessão: ${error.message}`,
          error
        );
        return null;
      }

      if (!session) {
        this.addResult(
          'Session Check',
          'info',
          'Nenhuma sessão ativa encontrada',
          null
        );
        return null;
      }

      this.addResult(
        'Session Check',
        'success',
        'Sessão ativa encontrada',
        {
          user_id: session.user.id,
          email: session.user.email,
          expires_at: session.expires_at
        }
      );

      return session;
    } catch (error) {
      this.addResult(
        'Session Check',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return null;
    }
  }

  /**
   * Busca dados do perfil do usuário
   */
  async fetchUserProfile(userId) {
    try {
      console.log('\n🔍 Buscando dados do perfil...');
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, role')
        .eq('user_id', userId)
        .single();

      if (error) {
        this.addResult(
          'Profile Fetch',
          'error',
          `Erro ao buscar perfil: ${error.message}`,
          error
        );
        return null;
      }

      this.addResult(
        'Profile Fetch',
        'success',
        'Perfil encontrado com sucesso',
        profile
      );

      return profile;
    } catch (error) {
      this.addResult(
        'Profile Fetch',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return null;
    }
  }

  /**
   * Simula a lógica de redirecionamento do useAuth
   */
  simulateRedirectLogic(userProfile) {
    try {
      console.log('\n🔍 Simulando lógica de redirecionamento...');
      
      if (!userProfile) {
        this.addResult(
          'Redirect Logic',
          'error',
          'Perfil do usuário não disponível',
          null
        );
        return null;
      }

      const role = userProfile.role || 'student';
      let redirectPath;

      // Lógica do useAuth.ts (linhas 225-237)
      if (role === 'admin' || role === 'instructor') {
        redirectPath = '/admin';
      } else {
        redirectPath = '/app';
      }

      this.addResult(
        'Redirect Logic',
        'success',
        `Usuário com role '${role}' deve ser redirecionado para: ${redirectPath}`,
        { role, redirect_path: redirectPath }
      );

      return redirectPath;
    } catch (error) {
      this.addResult(
        'Redirect Logic',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return null;
    }
  }

  /**
   * Testa o RequireRole component
   */
  async testRequireRole(userProfile) {
    try {
      console.log('\n🔍 Testando RequireRole component...');
      
      if (!userProfile) {
        this.addResult(
          'RequireRole Test',
          'error',
          'Perfil do usuário não disponível',
          null
        );
        return false;
      }

      const userRole = userProfile.role;
      const requiredRoles = ['admin', 'instructor'];
      const hasAccess = requiredRoles.includes(userRole);

      if (hasAccess) {
        this.addResult(
          'RequireRole Test',
          'success',
          `Usuário com role '${userRole}' tem acesso às rotas admin`,
          { user_role: userRole, required_roles: requiredRoles, has_access: hasAccess }
        );
      } else {
        this.addResult(
          'RequireRole Test',
          'error',
          `Usuário com role '${userRole}' NÃO tem acesso às rotas admin`,
          { user_role: userRole, required_roles: requiredRoles, has_access: hasAccess }
        );
      }

      return hasAccess;
    } catch (error) {
      this.addResult(
        'RequireRole Test',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return false;
    }
  }

  /**
   * Verifica problemas comuns
   */
  async checkCommonIssues() {
    try {
      console.log('\n🔍 Verificando problemas comuns...');
      
      // 1. Verificar se RLS está habilitado
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', 'profiles');

      if (tableError) {
        this.addResult(
          'RLS Check',
          'warning',
          'Não foi possível verificar RLS',
          tableError
        );
      } else if (tableInfo && tableInfo.length > 0) {
        const rlsEnabled = tableInfo[0].rowsecurity;
        this.addResult(
          'RLS Check',
          rlsEnabled ? 'success' : 'warning',
          `RLS ${rlsEnabled ? 'habilitado' : 'desabilitado'} na tabela profiles`,
          { rls_enabled: rlsEnabled }
        );
      }

      // 2. Verificar políticas RLS
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('policyname, cmd')
        .eq('schemaname', 'public')
        .eq('tablename', 'profiles');

      if (policiesError) {
        this.addResult(
          'Policies Check',
          'warning',
          'Não foi possível verificar políticas RLS',
          policiesError
        );
      } else {
        this.addResult(
          'Policies Check',
          'info',
          `Encontradas ${policies.length} políticas RLS`,
          policies
        );
      }

    } catch (error) {
      this.addResult(
        'Common Issues',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
    }
  }

  /**
   * Gera relatório de diagnóstico
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE TESTE DE LOGIN E REDIRECIONAMENTO');
    console.log('='.repeat(80));
    console.log(`🎯 Usuário alvo: ${TARGET_EMAIL}`);
    console.log(`⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    
    console.log('\n📋 RESUMO DOS RESULTADOS:');
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const infoCount = this.results.filter(r => r.status === 'info').length;
    
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   ⚠️  Avisos: ${warningCount}`);
    console.log(`   ℹ️  Informações: ${infoCount}`);
    
    console.log('\n🔍 POSSÍVEIS CAUSAS DO PROBLEMA:');
    
    if (errorCount > 0) {
      console.log('   1. ❌ Problemas na verificação de sessão ou perfil');
      console.log('   2. ❌ Role do usuário não está correta');
      console.log('   3. ❌ Políticas RLS muito restritivas');
    } else {
      console.log('   1. ✅ Dados do usuário estão corretos');
      console.log('   2. ✅ Lógica de redirecionamento está funcionando');
      console.log('   3. 🤔 Problema pode estar no frontend (cache, localStorage, etc.)');
    }
    
    console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
    console.log('   1. 🔄 Limpe o cache do navegador (Ctrl+Shift+Delete)');
    console.log('   2. 🔄 Faça logout completo e login novamente');
    console.log('   3. 🔄 Verifique o localStorage/sessionStorage do navegador');
    console.log('   4. 🔄 Teste em uma aba anônima/privada');
    console.log('   5. 🔄 Verifique o console do navegador por erros JavaScript');
    
    console.log('\n🛠️  VERIFICAÇÕES TÉCNICAS:');
    console.log('   1. Abra as DevTools do navegador (F12)');
    console.log('   2. Vá para a aba Application > Local Storage');
    console.log('   3. Limpe todos os dados do domínio');
    console.log('   4. Vá para a aba Network e monitore as requisições');
    console.log('   5. Faça login e veja se há erros 401/403');
    
    console.log('\n' + '='.repeat(80));
    
    return {
      success: errorCount === 0,
      total_checks: this.results.length,
      errors: errorCount,
      warnings: warningCount,
      results: this.results
    };
  }

  /**
   * Executa todos os testes
   */
  async run() {
    try {
      console.log('🚀 Iniciando teste de login e redirecionamento...');
      console.log(`🎯 Usuário alvo: ${TARGET_EMAIL}`);
      console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
      
      // 1. Verificar sessão
      const session = await this.simulateSessionCheck();
      
      if (session) {
        // 2. Buscar perfil
        const profile = await this.fetchUserProfile(session.user.id);
        
        if (profile) {
          // 3. Testar redirecionamento
          this.simulateRedirectLogic(profile);
          
          // 4. Testar RequireRole
          await this.testRequireRole(profile);
        }
      } else {
        this.addResult(
          'Overall Test',
          'info',
          'Usuário não está logado. Faça login primeiro.',
          null
        );
      }
      
      // 5. Verificar problemas comuns
      await this.checkCommonIssues();
      
      // 6. Gerar relatório
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro crítico durante teste:', error);
      this.addResult(
        'Critical Error',
        'error',
        `Erro crítico: ${error.message}`,
        error
      );
      return this.generateReport();
    }
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('test-login-redirect.js')) {
  const tester = new LoginRedirectTester();
  tester.run()
    .then((result) => {
      console.log('\n✅ Teste concluído!');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Falha no teste:', error);
      process.exit(1);
    });
}

export default LoginRedirectTester;