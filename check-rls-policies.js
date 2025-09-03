import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase com service role
const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Verificar políticas RLS da tabela modules
 */
async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS da tabela modules...');
  
  try {
    // Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename = 'modules'
          ORDER BY policyname;
        `
      });
      
    if (policiesError) {
      console.error('❌ Erro ao buscar políticas RLS:', policiesError);
      return;
    }
    
    console.log('📋 Políticas RLS encontradas:', policies?.length || 0);
    
    if (policies && policies.length > 0) {
      policies.forEach((policy, index) => {
        console.log(`\n📜 Política ${index + 1}:`, {
          nome: policy.policyname,
          comando: policy.cmd,
          roles: policy.roles,
          permissiva: policy.permissive,
          qualificador: policy.qual
        });
      });
    } else {
      console.log('⚠️ Nenhuma política RLS encontrada para a tabela modules');
    }
    
    // Verificar permissões das roles
    console.log('\n🔑 Verificando permissões das roles...');
    
    const { data: permissions, error: permError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            grantee,
            table_name,
            privilege_type
          FROM information_schema.role_table_grants 
          WHERE table_schema = 'public' 
            AND table_name = 'modules'
            AND grantee IN ('anon', 'authenticated')
          ORDER BY grantee, privilege_type;
        `
      });
      
    if (permError) {
      console.error('❌ Erro ao buscar permissões:', permError);
      return;
    }
    
    console.log('📋 Permissões encontradas:', permissions?.length || 0);
    
    if (permissions && permissions.length > 0) {
      const permissionsByRole = {};
      permissions.forEach(perm => {
        if (!permissionsByRole[perm.grantee]) {
          permissionsByRole[perm.grantee] = [];
        }
        permissionsByRole[perm.grantee].push(perm.privilege_type);
      });
      
      Object.entries(permissionsByRole).forEach(([role, privs]) => {
        console.log(`\n🔐 Role '${role}':`, privs.join(', '));
      });
    } else {
      console.log('⚠️ Nenhuma permissão encontrada para as roles anon/authenticated');
    }
    
    // Verificar se RLS está habilitado
    console.log('\n🛡️ Verificando status do RLS...');
    
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE tablename = 'modules' AND schemaname = 'public';
        `
      });
      
    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError);
      return;
    }
    
    if (rlsStatus && rlsStatus.length > 0) {
      console.log('🛡️ Status RLS:', {
        tabela: rlsStatus[0].tablename,
        rlsHabilitado: rlsStatus[0].rls_enabled
      });
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar verificação
checkRLSPolicies();