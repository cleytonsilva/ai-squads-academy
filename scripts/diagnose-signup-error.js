/**
 * Script de Diagnóstico - Erro 500 no Signup
 * 
 * Este script verifica se a migração 20250130000000_fix_profiles_admin_creation.sql
 * foi aplicada corretamente e identifica a causa do erro 500 no processo de signup.
 * 
 * Testes realizados:
 * 1. Verificação da estrutura da tabela profiles
 * 2. Teste das políticas RLS
 * 3. Verificação da função handle_new_user
 * 4. Teste de criação de usuário
 * 5. Análise de logs de erro
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

// Cliente com service role para operações administrativas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class SignupDiagnostic {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Adiciona resultado de teste
   */
  addResult(test, status, message, details = null) {
    const result = {
      test,
      status, // 'success', 'error', 'warning'
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${message}`);
    
    if (details) {
      console.log(`   Detalhes:`, details);
    }
  }

  /**
   * Verifica se a tabela profiles tem todas as colunas necessárias
   */
  async checkProfilesTableStructure() {
    try {
      console.log('\n🔍 Verificando estrutura da tabela profiles...');
      
      const { data, error } = await supabase.rpc('get_table_columns', {
        table_name: 'profiles',
        schema_name: 'public'
      });

      if (error) {
        // Fallback: tentar query direta
        const { data: columns, error: columnError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_name', 'profiles')
          .eq('table_schema', 'public');

        if (columnError) {
          this.addResult(
            'Estrutura da Tabela',
            'error',
            'Não foi possível verificar a estrutura da tabela profiles',
            columnError
          );
          return false;
        }

        const columnNames = columns.map(col => col.column_name);
        const requiredColumns = ['user_id', 'name', 'email', 'display_name', 'xp', 'profile_data', 'role'];
        const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

        if (missingColumns.length > 0) {
          this.addResult(
            'Estrutura da Tabela',
            'error',
            `Colunas faltantes: ${missingColumns.join(', ')}`,
            { existingColumns: columnNames, missingColumns }
          );
          return false;
        }

        this.addResult(
          'Estrutura da Tabela',
          'success',
          'Todas as colunas necessárias estão presentes',
          { columns: columnNames }
        );
        return true;
      }
    } catch (error) {
      this.addResult(
        'Estrutura da Tabela',
        'error',
        'Erro ao verificar estrutura da tabela',
        error.message
      );
      return false;
    }
  }

  /**
   * Verifica se as políticas RLS estão configuradas corretamente
   */
  async checkRLSPolicies() {
    try {
      console.log('\n🔍 Verificando políticas RLS...');
      
      const { data: policies, error } = await supabase
        .from('pg_policies')
        .select('policyname, cmd, qual, with_check')
        .eq('schemaname', 'public')
        .eq('tablename', 'profiles');

      if (error) {
        this.addResult(
          'Políticas RLS',
          'error',
          'Não foi possível verificar as políticas RLS',
          error
        );
        return false;
      }

      const expectedPolicies = [
        'profiles_select_policy',
        'profiles_insert_policy',
        'profiles_update_policy',
        'profiles_delete_policy'
      ];

      const existingPolicies = policies.map(p => p.policyname);
      const missingPolicies = expectedPolicies.filter(policy => !existingPolicies.includes(policy));

      if (missingPolicies.length > 0) {
        this.addResult(
          'Políticas RLS',
          'error',
          `Políticas faltantes: ${missingPolicies.join(', ')}`,
          { existingPolicies, missingPolicies }
        );
        return false;
      }

      this.addResult(
        'Políticas RLS',
        'success',
        'Todas as políticas RLS estão configuradas',
        { policies: existingPolicies }
      );
      return true;
    } catch (error) {
      this.addResult(
        'Políticas RLS',
        'error',
        'Erro ao verificar políticas RLS',
        error.message
      );
      return false;
    }
  }

  /**
   * Verifica se a função handle_new_user existe e está correta
   */
  async checkHandleNewUserFunction() {
    try {
      console.log('\n🔍 Verificando função handle_new_user...');
      
      const { data: functions, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name, routine_definition')
        .eq('routine_schema', 'public')
        .eq('routine_name', 'handle_new_user');

      if (error) {
        this.addResult(
          'Função handle_new_user',
          'error',
          'Não foi possível verificar a função handle_new_user',
          error
        );
        return false;
      }

      if (!functions || functions.length === 0) {
        this.addResult(
          'Função handle_new_user',
          'error',
          'Função handle_new_user não encontrada',
          null
        );
        return false;
      }

      // Verificar se a função inclui display_name
      const functionDef = functions[0].routine_definition;
      if (!functionDef.includes('display_name')) {
        this.addResult(
          'Função handle_new_user',
          'warning',
          'Função handle_new_user pode não incluir display_name',
          { definition: functionDef.substring(0, 200) + '...' }
        );
        return false;
      }

      this.addResult(
        'Função handle_new_user',
        'success',
        'Função handle_new_user existe e parece estar correta',
        null
      );
      return true;
    } catch (error) {
      this.addResult(
        'Função handle_new_user',
        'error',
        'Erro ao verificar função handle_new_user',
        error.message
      );
      return false;
    }
  }

  /**
   * Verifica se o trigger está configurado corretamente
   */
  async checkTrigger() {
    try {
      console.log('\n🔍 Verificando trigger on_auth_user_created...');
      
      const { data: triggers, error } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation, action_timing')
        .eq('trigger_schema', 'auth')
        .eq('event_object_table', 'users')
        .eq('trigger_name', 'on_auth_user_created');

      if (error) {
        this.addResult(
          'Trigger',
          'error',
          'Não foi possível verificar o trigger',
          error
        );
        return false;
      }

      if (!triggers || triggers.length === 0) {
        this.addResult(
          'Trigger',
          'error',
          'Trigger on_auth_user_created não encontrado',
          null
        );
        return false;
      }

      this.addResult(
        'Trigger',
        'success',
        'Trigger on_auth_user_created está configurado',
        triggers[0]
      );
      return true;
    } catch (error) {
      this.addResult(
        'Trigger',
        'error',
        'Erro ao verificar trigger',
        error.message
      );
      return false;
    }
  }

  /**
   * Testa criação de usuário com dados simulados
   */
  async testUserCreation() {
    try {
      console.log('\n🔍 Testando criação de usuário...');
      
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      // Tentar criar usuário usando admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: {
          display_name: 'Test User'
        }
      });

      if (authError) {
        this.addResult(
          'Criação de Usuário',
          'error',
          `Erro ao criar usuário: ${authError.message}`,
          authError
        );
        return false;
      }

      if (!authData.user) {
        this.addResult(
          'Criação de Usuário',
          'error',
          'Usuário criado mas dados não retornados',
          null
        );
        return false;
      }

      // Verificar se o perfil foi criado automaticamente
      await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar trigger
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) {
        this.addResult(
          'Criação de Perfil',
          'error',
          `Perfil não foi criado automaticamente: ${profileError.message}`,
          profileError
        );
        
        // Limpar usuário de teste
        await supabase.auth.admin.deleteUser(authData.user.id);
        return false;
      }

      this.addResult(
        'Criação de Usuário',
        'success',
        'Usuário e perfil criados com sucesso',
        { userId: authData.user.id, profile }
      );

      // Limpar usuário de teste
      await supabase.auth.admin.deleteUser(authData.user.id);
      return true;
    } catch (error) {
      this.addResult(
        'Criação de Usuário',
        'error',
        'Erro durante teste de criação de usuário',
        error.message
      );
      return false;
    }
  }

  /**
   * Verifica configurações de autenticação
   */
  async checkAuthConfiguration() {
    try {
      console.log('\n🔍 Verificando configurações de autenticação...');
      
      // Verificar se o RLS está habilitado na tabela profiles
      const { data: tableInfo, error } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public')
        .eq('tablename', 'profiles');

      if (error) {
        this.addResult(
          'Configuração Auth',
          'error',
          'Não foi possível verificar configurações de RLS',
          error
        );
        return false;
      }

      if (!tableInfo || tableInfo.length === 0) {
        this.addResult(
          'Configuração Auth',
          'error',
          'Tabela profiles não encontrada',
          null
        );
        return false;
      }

      const rlsEnabled = tableInfo[0].rowsecurity;
      if (!rlsEnabled) {
        this.addResult(
          'Configuração Auth',
          'warning',
          'RLS não está habilitado na tabela profiles',
          null
        );
        return false;
      }

      this.addResult(
        'Configuração Auth',
        'success',
        'RLS está habilitado na tabela profiles',
        null
      );
      return true;
    } catch (error) {
      this.addResult(
        'Configuração Auth',
        'error',
        'Erro ao verificar configurações de autenticação',
        error.message
      );
      return false;
    }
  }

  /**
   * Gera relatório final com recomendações
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE DIAGNÓSTICO - ERRO 500 NO SIGNUP');
    console.log('='.repeat(60));
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`\n📈 Resumo dos Testes:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   ⚠️  Avisos: ${warningCount}`);
    
    if (errorCount > 0) {
      console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');
      this.results
        .filter(r => r.status === 'error')
        .forEach((result, index) => {
          console.log(`\n${index + 1}. ${result.test}`);
          console.log(`   Erro: ${result.message}`);
          if (result.details) {
            console.log(`   Detalhes:`, result.details);
          }
        });
    }
    
    console.log('\n💡 RECOMENDAÇÕES:');
    
    if (errorCount === 0) {
      console.log('   ✅ Todas as verificações passaram!');
      console.log('   ✅ A migração parece ter sido aplicada corretamente.');
      console.log('   🔍 O erro 500 pode estar relacionado a:');
      console.log('      - Problemas de rede ou conectividade');
      console.log('      - Configurações do Supabase Auth');
      console.log('      - Rate limiting ou quotas excedidas');
      console.log('      - Problemas temporários no servidor Supabase');
    } else {
      console.log('   🔧 Execute os seguintes comandos para corrigir os problemas:');
      
      if (this.results.some(r => r.test === 'Estrutura da Tabela' && r.status === 'error')) {
        console.log('   1. Reaplicar migração da tabela profiles:');
        console.log('      supabase db reset --linked');
        console.log('      supabase db push --linked');
      }
      
      if (this.results.some(r => r.test === 'Políticas RLS' && r.status === 'error')) {
        console.log('   2. Recriar políticas RLS:');
        console.log('      Execute a migração 20250130000000_fix_profiles_admin_creation.sql');
      }
      
      if (this.results.some(r => r.test === 'Função handle_new_user' && r.status === 'error')) {
        console.log('   3. Recriar função handle_new_user:');
        console.log('      Execute a seção 5 da migração 20250130000000_fix_profiles_admin_creation.sql');
      }
      
      if (this.results.some(r => r.test === 'Trigger' && r.status === 'error')) {
        console.log('   4. Recriar trigger:');
        console.log('      Execute a seção 6 da migração 20250130000000_fix_profiles_admin_creation.sql');
      }
    }
    
    console.log('\n🔗 PRÓXIMOS PASSOS:');
    console.log('   1. Se todos os testes passaram, verifique logs do Supabase Dashboard');
    console.log('   2. Teste signup com dados reais em ambiente controlado');
    console.log('   3. Verifique configurações de CORS e domínios permitidos');
    console.log('   4. Considere implementar retry logic no frontend');
    
    console.log('\n' + '='.repeat(60));
    
    return {
      summary: {
        total: this.results.length,
        success: successCount,
        errors: errorCount,
        warnings: warningCount
      },
      results: this.results,
      migrationApplied: errorCount === 0
    };
  }

  /**
   * Executa todos os testes de diagnóstico
   */
  async runDiagnostic() {
    console.log('🚀 Iniciando diagnóstico do erro 500 no signup...');
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    
    try {
      // Executar todos os testes
      await this.checkProfilesTableStructure();
      await this.checkRLSPolicies();
      await this.checkHandleNewUserFunction();
      await this.checkTrigger();
      await this.checkAuthConfiguration();
      await this.testUserCreation();
      
      // Gerar relatório final
      return this.generateReport();
    } catch (error) {
      console.error('❌ Erro durante diagnóstico:', error);
      this.addResult(
        'Diagnóstico Geral',
        'error',
        'Erro inesperado durante diagnóstico',
        error.message
      );
      return this.generateReport();
    }
  }
}

// Executar diagnóstico se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('diagnose-signup-error.js')) {
  const diagnostic = new SignupDiagnostic();
  diagnostic.runDiagnostic()
    .then((report) => {
      console.log('\n✅ Diagnóstico concluído!');
      process.exit(report.summary.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Falha no diagnóstico:', error);
      process.exit(1);
    });
}

export default SignupDiagnostic;