/**
 * Script simples para corrigir problemas de signup
 * Usa apenas operações básicas do cliente Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

// Cliente com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndFixProfiles() {
  console.log('🔍 Verificando estrutura da tabela profiles...');
  
  try {
    // Tentar inserir um perfil de teste para verificar se as colunas existem
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: testUserId,
        name: 'Test',
        display_name: 'Test User',
        email: 'test@example.com',
        role: 'student',
        xp: 0,
        profile_data: {}
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.log('❌ Erro ao testar estrutura da tabela:', error.message);
      
      if (error.message.includes('column "display_name" does not exist')) {
        console.log('⚠️  Coluna display_name não existe');
        return false;
      }
      if (error.message.includes('column "xp" does not exist')) {
        console.log('⚠️  Coluna xp não existe');
        return false;
      }
      if (error.message.includes('column "profile_data" does not exist')) {
        console.log('⚠️  Coluna profile_data não existe');
        return false;
      }
      
      return false;
    }
    
    // Remover o registro de teste
    await supabase
      .from('profiles')
      .delete()
      .eq('user_id', testUserId);
    
    console.log('✅ Estrutura da tabela profiles está correta');
    return true;
  } catch (error) {
    console.log('❌ Erro ao verificar tabela profiles:', error.message);
    return false;
  }
}

async function testUserCreationFlow() {
  console.log('\n🧪 Testando fluxo completo de criação de usuário...');
  
  try {
    const testEmail = `test-flow-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('🔄 Criando usuário de teste...');
    
    // Criar usuário usando admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        display_name: 'Test Flow User',
        name: 'Test Flow User'
      }
    });
    
    if (authError) {
      console.log('❌ Erro ao criar usuário:', authError.message);
      
      if (authError.message.includes('Database error')) {
        console.log('🔍 Erro de banco de dados detectado - problema na função handle_new_user');
      }
      
      return false;
    }
    
    console.log('✅ Usuário criado com sucesso');
    
    // Aguardar um pouco para o trigger executar
    console.log('⏳ Aguardando trigger handle_new_user...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verificar se o perfil foi criado automaticamente
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Perfil não foi criado automaticamente:', profileError.message);
      console.log('🔍 Problema na função handle_new_user ou trigger');
      
      // Tentar criar perfil manualmente
      console.log('🔄 Tentando criar perfil manualmente...');
      const { error: manualError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: 'Test Flow User',
          display_name: 'Test Flow User',
          email: testEmail,
          role: 'student',
          xp: 0,
          profile_data: {}
        });
      
      if (manualError) {
        console.log('❌ Erro ao criar perfil manualmente:', manualError.message);
      } else {
        console.log('✅ Perfil criado manualmente com sucesso');
      }
    } else {
      console.log('✅ Perfil criado automaticamente:', {
        display_name: profile.display_name,
        xp: profile.xp,
        role: profile.role
      });
    }
    
    // Limpar usuário de teste
    console.log('🧹 Removendo usuário de teste...');
    await supabase.auth.admin.deleteUser(authData.user.id);
    
    return !profileError;
  } catch (error) {
    console.log('❌ Erro durante teste de fluxo:', error.message);
    return false;
  }
}

async function testSignupAPI() {
  console.log('\n🧪 Testando API de signup diretamente...');
  
  try {
    const testEmail = `test-signup-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Tentar signup normal (não admin)
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          display_name: 'Test Signup User'
        }
      }
    });
    
    if (error) {
      console.log('❌ Erro no signup:', error.message);
      
      if (error.message.includes('Database error')) {
        console.log('🔍 Erro de banco de dados no signup - confirma problema na função handle_new_user');
      }
      
      return false;
    }
    
    console.log('✅ Signup executado com sucesso');
    
    // Limpar se necessário
    if (data.user) {
      await supabase.auth.admin.deleteUser(data.user.id);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro durante teste de signup:', error.message);
    return false;
  }
}

async function generateReport() {
  console.log('🚀 Iniciando diagnóstico simplificado...');
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  
  const results = {
    profilesStructure: false,
    userCreationFlow: false,
    signupAPI: false
  };
  
  try {
    results.profilesStructure = await checkAndFixProfiles();
    results.userCreationFlow = await testUserCreationFlow();
    results.signupAPI = await testSignupAPI();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO DE DIAGNÓSTICO SIMPLIFICADO');
    console.log('='.repeat(60));
    console.log(`✅ Estrutura da tabela profiles: ${results.profilesStructure ? 'OK' : 'ERRO'}`);
    console.log(`✅ Fluxo de criação de usuário: ${results.userCreationFlow ? 'OK' : 'ERRO'}`);
    console.log(`✅ API de signup: ${results.signupAPI ? 'OK' : 'ERRO'}`);
    
    console.log('\n💡 DIAGNÓSTICO:');
    
    if (!results.profilesStructure) {
      console.log('❌ PROBLEMA: Estrutura da tabela profiles está incorreta');
      console.log('   Solução: Execute as migrações para adicionar colunas faltantes');
    }
    
    if (!results.userCreationFlow) {
      console.log('❌ PROBLEMA: Função handle_new_user não está funcionando');
      console.log('   Solução: Recrie a função handle_new_user e o trigger');
    }
    
    if (!results.signupAPI) {
      console.log('❌ PROBLEMA: API de signup está retornando erro 500');
      console.log('   Causa: Função handle_new_user com erro ou políticas RLS restritivas');
    }
    
    if (results.profilesStructure && results.userCreationFlow && results.signupAPI) {
      console.log('✅ TUDO OK: Todos os testes passaram!');
      console.log('   O erro 500 pode ser temporário ou relacionado a outro problema');
    }
    
    console.log('\n🔗 PRÓXIMOS PASSOS:');
    console.log('1. Se a estrutura da tabela estiver incorreta, execute as migrações SQL');
    console.log('2. Se a função handle_new_user estiver com problema, recrie-a');
    console.log('3. Verifique logs do Supabase Dashboard para mais detalhes');
    console.log('4. Teste signup no frontend após as correções');
    
    console.log('\n' + '='.repeat(60));
    
    return Object.values(results).every(r => r);
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('simple-fix.js')) {
  generateReport()
    .then((success) => {
      console.log('\n✅ Diagnóstico concluído!');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Falha no diagnóstico:', error);
      process.exit(1);
    });
}

export default generateReport;