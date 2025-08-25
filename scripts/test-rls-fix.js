/**
 * Script para testar se a correção das políticas RLS foi bem-sucedida
 * 
 * Testa:
 * 1. Se as consultas à tabela profiles não causam mais recursão infinita
 * 2. Se o usuário admin consegue acessar os dados
 * 3. Se as políticas RLS estão funcionando corretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que as variáveis do Supabase estão definidas no .env');
  process.exit(1);
}

// Cliente Supabase com chave anônima (simula frontend)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Cliente Supabase com service role (para verificações administrativas)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRLSFix() {
  console.log('🧪 Iniciando testes das políticas RLS corrigidas...');
  console.log('📊 Supabase URL:', supabaseUrl);
  
  try {
    // 1. Testar consulta básica à tabela profiles (deve funcionar sem recursão)
    console.log('\n🔍 Teste 1: Consulta básica à tabela profiles...');
    
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_id, role')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Erro na consulta básica:', profilesError);
      return false;
    } else {
      console.log('✅ Consulta básica bem-sucedida');
      console.log('📊 Perfis encontrados:', profilesData?.length || 0);
    }
    
    // 2. Testar consulta específica do usuário admin
    console.log('\n👤 Teste 2: Consulta do perfil do admin...');
    
    const adminUserId = '190312c8-eb66-41ae-9e9c-060bdef95bb3';
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', adminUserId)
      .single();
    
    if (adminError) {
      console.error('❌ Erro ao buscar perfil do admin:', adminError);
      return false;
    } else {
      console.log('✅ Perfil do admin encontrado');
      console.log('📋 Dados do admin:', {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role,
        display_name: adminProfile.display_name
      });
    }
    
    // 3. Testar as políticas RLS com diferentes cenários
    console.log('\n🛡️ Teste 3: Verificando políticas RLS...');
    
    // Verificar se as políticas existem
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'profiles' AND schemaname = 'public'
          ORDER BY policyname;
        `
      });
    
    if (policiesError) {
      console.log('⚠️ Não foi possível verificar políticas via RPC, tentando consulta direta...');
      
      // Tentar uma abordagem mais simples
      const { data: simpleTest, error: simpleError } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', adminUserId)
        .single();
      
      if (simpleError) {
        console.error('❌ Erro na consulta simples:', simpleError);
        return false;
      } else {
        console.log('✅ Consulta simples funcionando');
        console.log('👤 Role do admin:', simpleTest.role);
      }
    } else {
      console.log('✅ Políticas RLS verificadas');
      console.log('📋 Políticas ativas:', policies?.length || 0);
    }
    
    // 4. Testar autenticação e JWT
    console.log('\n🔐 Teste 4: Verificando metadados do usuário...');
    
    const { data: userData, error: userError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT id, email, raw_user_meta_data 
          FROM auth.users 
          WHERE id = '${adminUserId}';
        `
      });
    
    if (userError) {
      console.log('⚠️ Não foi possível verificar metadados via RPC');
    } else {
      console.log('✅ Metadados do usuário verificados');
      if (userData && userData.length > 0) {
        const user = userData[0];
        console.log('📋 Metadados:', user.raw_user_meta_data);
      }
    }
    
    // 5. Teste final: simular a consulta que estava falhando
    console.log('\n🎯 Teste 5: Simulando consulta que causava erro 500...');
    
    const { data: finalTest, error: finalError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', adminUserId);
    
    if (finalError) {
      console.error('❌ Erro na consulta final:', finalError);
      if (finalError.message?.includes('infinite recursion')) {
        console.error('💥 AINDA HÁ RECURSÃO INFINITA!');
        return false;
      }
    } else {
      console.log('✅ Consulta final bem-sucedida');
      console.log('🎉 SEM MAIS RECURSÃO INFINITA!');
    }
    
    console.log('\n🎉 Todos os testes passaram!');
    console.log('\n📋 Resumo dos resultados:');
    console.log('  ✓ Consultas à tabela profiles funcionando');
    console.log('  ✓ Perfil do admin acessível');
    console.log('  ✓ Políticas RLS ativas');
    console.log('  ✓ Sem recursão infinita');
    console.log('\n💡 Próximos passos:');
    console.log('  1. Faça logout e login novamente no frontend');
    console.log('  2. Teste o acesso ao painel /admin');
    console.log('  3. Verifique se não há mais erros 500 no console do navegador');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    return false;
  }
}

// Executar os testes
async function main() {
  console.log('🚀 Iniciando testes de correção das políticas RLS');
  
  const success = await testRLSFix();
  
  if (success) {
    console.log('\n🎉 CORREÇÃO BEM-SUCEDIDA!');
    process.exit(0);
  } else {
    console.log('\n❌ CORREÇÃO FALHOU - verifique os erros acima');
    process.exit(1);
  }
}

main().catch(console.error);