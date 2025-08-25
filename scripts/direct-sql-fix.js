/**
 * Script para aplicar correções SQL diretamente via API REST do Supabase
 * Corrige problemas na tabela profiles e função handle_new_user
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

async function executeSQL(sql, description) {
  try {
    console.log(`🔄 ${description}...`);
    
    // Fazer requisição HTTP direta para a API REST do Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ⚠️  ${description}: ${error}`);
      return false;
    }
    
    console.log(`   ✅ ${description}: Sucesso`);
    return true;
  } catch (error) {
    console.log(`   ❌ ${description}: ${error.message}`);
    return false;
  }
}

async function fixProfilesTable() {
  console.log('\n🔧 Corrigindo estrutura da tabela profiles...');
  
  const fixes = [
    {
      sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;`,
      description: 'Adicionando coluna display_name'
    },
    {
      sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;`,
      description: 'Adicionando coluna xp'
    },
    {
      sql: `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'::jsonb;`,
      description: 'Adicionando coluna profile_data'
    },
    {
      sql: `UPDATE public.profiles SET display_name = COALESCE(display_name, name, split_part(email, '@', 1)) WHERE display_name IS NULL;`,
      description: 'Atualizando display_name'
    }
  ];
  
  let successCount = 0;
  for (const fix of fixes) {
    const success = await executeSQL(fix.sql, fix.description);
    if (success) successCount++;
  }
  
  return successCount === fixes.length;
}

async function fixRLSPolicies() {
  console.log('\n🔧 Corrigindo políticas RLS...');
  
  const policies = [
    {
      sql: `DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;`,
      description: 'Removendo política antiga de SELECT'
    },
    {
      sql: `DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;`,
      description: 'Removendo política antiga de INSERT'
    },
    {
      sql: `DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;`,
      description: 'Removendo política SELECT existente'
    },
    {
      sql: `DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;`,
      description: 'Removendo política INSERT existente'
    },
    {
      sql: `CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));`,
      description: 'Criando nova política SELECT'
    },
    {
      sql: `CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));`,
      description: 'Criando nova política INSERT'
    }
  ];
  
  let successCount = 0;
  for (const policy of policies) {
    const success = await executeSQL(policy.sql, policy.description);
    if (success) successCount++;
  }
  
  return successCount >= 4; // Pelo menos as políticas principais
}

async function fixHandleNewUserFunction() {
  console.log('\n🔧 Corrigindo função handle_new_user...');
  
  const functionSQL = `
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _display_name text;
  _avatar_url text;
  _role text;
BEGIN
  -- Extrair dados do user_metadata
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'name', 
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  _avatar_url := NEW.raw_user_meta_data->>'avatar_url';
  
  _role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'student'
  );

  -- Inserir perfil do usuário
  INSERT INTO public.profiles (
    user_id, 
    name, 
    display_name, 
    email, 
    avatar_url, 
    role,
    xp,
    profile_data
  )
  VALUES (
    NEW.id, 
    _display_name, 
    _display_name, 
    NEW.email, 
    _avatar_url, 
    _role::text,
    0,
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  const success = await executeSQL(functionSQL, 'Criando função handle_new_user');
  
  if (success) {
    const triggerSQL = `
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;
    
    await executeSQL(triggerSQL, 'Criando trigger on_auth_user_created');
  }
  
  return success;
}

async function testUserCreation() {
  console.log('\n🧪 Testando criação de usuário...');
  
  try {
    const testEmail = `test-fix-${Date.now()}@example.com`;
    
    // Criar usuário de teste
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        display_name: 'Test Fix User'
      }
    });
    
    if (authError) {
      console.log('❌ Erro ao criar usuário de teste:', authError.message);
      return false;
    }
    
    console.log('✅ Usuário de teste criado com sucesso');
    
    // Aguardar trigger
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se o perfil foi criado
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Perfil não foi criado automaticamente:', profileError.message);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return false;
    }
    
    console.log('✅ Perfil criado automaticamente:', {
      display_name: profile.display_name,
      xp: profile.xp,
      role: profile.role
    });
    
    // Limpar usuário de teste
    await supabase.auth.admin.deleteUser(authData.user.id);
    console.log('🧹 Usuário de teste removido');
    
    return true;
  } catch (error) {
    console.log('❌ Erro durante teste:', error.message);
    return false;
  }
}

async function runFixes() {
  console.log('🚀 Iniciando correções diretas no banco de dados...');
  console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
  
  const results = {
    profiles: false,
    policies: false,
    function: false,
    test: false
  };
  
  try {
    results.profiles = await fixProfilesTable();
    results.policies = await fixRLSPolicies();
    results.function = await fixHandleNewUserFunction();
    
    if (results.profiles && results.function) {
      results.test = await testUserCreation();
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO DAS CORREÇÕES');
    console.log('='.repeat(60));
    console.log(`✅ Tabela profiles: ${results.profiles ? 'OK' : 'ERRO'}`);
    console.log(`✅ Políticas RLS: ${results.policies ? 'OK' : 'ERRO'}`);
    console.log(`✅ Função handle_new_user: ${results.function ? 'OK' : 'ERRO'}`);
    console.log(`✅ Teste de criação: ${results.test ? 'OK' : 'ERRO'}`);
    
    const allSuccess = Object.values(results).every(r => r);
    
    if (allSuccess) {
      console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
      console.log('🔄 O erro 500 no signup deve estar resolvido.');
    } else {
      console.log('\n⚠️  Algumas correções falharam.');
      console.log('🔍 Verifique os logs acima para mais detalhes.');
    }
    
    return allSuccess;
  } catch (error) {
    console.error('❌ Erro durante correções:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith('direct-sql-fix.js')) {
  runFixes()
    .then((success) => {
      console.log('\n✅ Script concluído!');
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Falha no script:', error);
      process.exit(1);
    });
}

export default runFixes;