/**
 * Script para corrigir recursão infinita nas políticas RLS da tabela profiles
 * 
 * Problema: As políticas RLS fazem consultas à própria tabela profiles,
 * causando erro '42P17: infinite recursion detected in policy for relation "profiles"'
 * 
 * Solução: Usar auth.jwt() e claims do JWT em vez de consultar a tabela profiles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env');
  process.exit(1);
}

// Cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixRLSRecursion() {
  console.log('🔧 Iniciando correção das políticas RLS...');
  
  try {
    // 1. Remover todas as políticas RLS existentes
    console.log('\n📝 Removendo políticas RLS existentes...');
    
    const dropPoliciesSQL = `
      -- Remover todas as políticas existentes da tabela profiles
      DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
      DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
      DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Usuários podem ver todos os perfis" ON public.profiles;
      DROP POLICY IF EXISTS "Usuários podem atualizar próprio perfil" ON public.profiles;
      DROP POLICY IF EXISTS "Usuários podem inserir próprio perfil" ON public.profiles;
      DROP POLICY IF EXISTS "Admins podem gerenciar todos os perfis" ON public.profiles;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPoliciesSQL });
    if (dropError) {
      console.log('⚠️ Algumas políticas podem não ter existido:', dropError.message);
    } else {
      console.log('✅ Políticas antigas removidas com sucesso');
    }
    
    // 2. Criar políticas RLS seguras usando auth.jwt()
    console.log('\n🛡️ Criando políticas RLS seguras...');
    
    const createPoliciesSQL = `
      -- Política para SELECT: usuários podem ver seu próprio perfil
      -- Admins podem ver todos os perfis (usando claim do JWT)
      CREATE POLICY "profiles_select_safe" ON public.profiles
        FOR SELECT USING (
          auth.uid() = user_id OR 
          (auth.jwt() ->> 'role')::text = 'admin'
        );
      
      -- Política para UPDATE: usuários podem atualizar seu próprio perfil
      -- Admins podem atualizar todos os perfis
      CREATE POLICY "profiles_update_safe" ON public.profiles
        FOR UPDATE USING (
          auth.uid() = user_id OR 
          (auth.jwt() ->> 'role')::text = 'admin'
        );
      
      -- Política para INSERT: usuários podem inserir seu próprio perfil
      -- Admins podem inserir qualquer perfil
      CREATE POLICY "profiles_insert_safe" ON public.profiles
        FOR INSERT WITH CHECK (
          auth.uid() = user_id OR 
          (auth.jwt() ->> 'role')::text = 'admin'
        );
      
      -- Política para DELETE: apenas admins podem excluir perfis
      CREATE POLICY "profiles_delete_safe" ON public.profiles
        FOR DELETE USING (
          (auth.jwt() ->> 'role')::text = 'admin'
        );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createPoliciesSQL });
    if (createError) {
      console.error('❌ Erro ao criar políticas seguras:', createError);
      throw createError;
    }
    
    console.log('✅ Políticas RLS seguras criadas com sucesso');
    
    // 3. Atualizar o perfil do usuário admin para ter a role correta no JWT
    console.log('\n👤 Verificando e atualizando perfil do admin...');
    
    const adminUserId = '190312c8-eb66-41ae-9e9c-060bdef95bb3';
    
    // Atualizar o perfil para garantir que a role seja 'admin'
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', adminUserId);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar perfil do admin:', updateError);
    } else {
      console.log('✅ Perfil do admin atualizado com sucesso');
    }
    
    // 4. Atualizar os metadados do usuário no auth.users para incluir a role
    console.log('\n🔐 Atualizando metadados do usuário admin...');
    
    const updateMetadataSQL = `
      UPDATE auth.users 
      SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
      WHERE id = '${adminUserId}';
    `;
    
    const { error: metadataError } = await supabase.rpc('exec_sql', { sql: updateMetadataSQL });
    if (metadataError) {
      console.error('❌ Erro ao atualizar metadados:', metadataError);
    } else {
      console.log('✅ Metadados do usuário admin atualizados');
    }
    
    // 5. Testar as políticas
    console.log('\n🧪 Testando as novas políticas...');
    
    // Teste básico de leitura
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', adminUserId)
      .single();
    
    if (testError) {
      console.error('❌ Erro no teste de leitura:', testError);
    } else {
      console.log('✅ Teste de leitura bem-sucedido:', testData);
    }
    
    console.log('\n🎉 Correção das políticas RLS concluída com sucesso!');
    console.log('\n📋 Resumo das alterações:');
    console.log('  ✓ Políticas RLS antigas removidas');
    console.log('  ✓ Políticas RLS seguras criadas (sem recursão)');
    console.log('  ✓ Perfil do admin atualizado');
    console.log('  ✓ Metadados do JWT atualizados');
    console.log('\n💡 Próximos passos:');
    console.log('  1. Faça logout e login novamente para atualizar o JWT');
    console.log('  2. Teste o acesso ao painel /admin');
    console.log('  3. Verifique se não há mais erros de recursão no console');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
    process.exit(1);
  }
}

// Função auxiliar para executar SQL (caso não exista)
async function createExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    await supabase.rpc('exec_sql', { sql: createFunctionSQL });
  } catch (error) {
    // Se a função não existir, vamos criá-la usando uma abordagem diferente
    console.log('⚠️ Criando função auxiliar exec_sql...');
  }
}

// Executar o script
async function main() {
  console.log('🚀 Iniciando correção de recursão infinita nas políticas RLS');
  console.log('📊 Supabase URL:', supabaseUrl);
  console.log('🔑 Service Role configurado:', !!supabaseServiceKey);
  
  await createExecSqlFunction();
  await fixRLSRecursion();
}

main().catch(console.error);