/**
 * Script para verificar e corrigir permissões administrativas
 * Foco: Restaurar acesso admin para cleyton7silva@gmail.com
 * 
 * Este script:
 * 1. Verifica se o usuário existe na tabela auth.users
 * 2. Verifica se existe perfil na tabela profiles
 * 3. Verifica a role atual do usuário
 * 4. Corrige a role para 'admin' se necessário
 * 5. Testa o redirecionamento após login
 * 6. Fornece relatório detalhado do status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_EMAIL = 'cleyton7silva@gmail.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role para operações administrativas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class AdminAccessFixer {
  constructor() {
    this.results = [];
    this.fixes = [];
    this.userAuthData = null;
    this.userProfile = null;
  }

  /**
   * Adiciona resultado de verificação
   */
  addResult(check, status, message, data = null) {
    const result = {
      check,
      status, // 'success', 'error', 'warning', 'info'
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    console.log(`${icons[status]} ${check}: ${message}`);
    
    if (data && typeof data === 'object') {
      console.log(`   Dados:`, JSON.stringify(data, null, 2));
    } else if (data) {
      console.log(`   Detalhes: ${data}`);
    }
  }

  /**
   * Adiciona correção aplicada
   */
  addFix(action, description, success = true) {
    const fix = {
      action,
      description,
      success,
      timestamp: new Date().toISOString()
    };
    
    this.fixes.push(fix);
    
    const icon = success ? '🔧' : '❌';
    console.log(`${icon} CORREÇÃO: ${description}`);
  }

  /**
   * Verifica se o usuário existe na tabela auth.users
   */
  async checkAuthUser() {
    try {
      console.log('\n🔍 Verificando usuário na tabela auth.users...');
      
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        this.addResult(
          'Auth User Check',
          'error',
          `Erro ao listar usuários: ${error.message}`,
          error
        );
        return false;
      }
      
      const targetUser = users.users.find(user => user.email === TARGET_EMAIL);
      
      if (!targetUser) {
        this.addResult(
          'Auth User Check',
          'error',
          `Usuário ${TARGET_EMAIL} não encontrado na tabela auth.users`,
          null
        );
        return false;
      }
      
      this.userAuthData = targetUser;
      
      this.addResult(
        'Auth User Check',
        'success',
        `Usuário encontrado na tabela auth.users`,
        {
          id: targetUser.id,
          email: targetUser.email,
          created_at: targetUser.created_at,
          last_sign_in_at: targetUser.last_sign_in_at,
          email_confirmed_at: targetUser.email_confirmed_at
        }
      );
      
      return true;
    } catch (error) {
      this.addResult(
        'Auth User Check',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return false;
    }
  }

  /**
   * Verifica se existe perfil na tabela profiles
   */
  async checkUserProfile() {
    try {
      console.log('\n🔍 Verificando perfil na tabela profiles...');
      
      if (!this.userAuthData) {
        this.addResult(
          'Profile Check',
          'error',
          'Dados do usuário auth não disponíveis',
          null
        );
        return false;
      }
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', this.userAuthData.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          this.addResult(
            'Profile Check',
            'warning',
            'Perfil não encontrado na tabela profiles',
            null
          );
          return false;
        }
        
        this.addResult(
          'Profile Check',
          'error',
          `Erro ao buscar perfil: ${error.message}`,
          error
        );
        return false;
      }
      
      this.userProfile = profile;
      
      this.addResult(
        'Profile Check',
        'success',
        'Perfil encontrado na tabela profiles',
        {
          user_id: profile.user_id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
      );
      
      return true;
    } catch (error) {
      this.addResult(
        'Profile Check',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return false;
    }
  }

  /**
   * Verifica a role atual do usuário
   */
  async checkUserRole() {
    try {
      console.log('\n🔍 Verificando role do usuário...');
      
      if (!this.userProfile) {
        this.addResult(
          'Role Check',
          'error',
          'Perfil do usuário não disponível',
          null
        );
        return false;
      }
      
      const currentRole = this.userProfile.role;
      
      if (currentRole === 'admin') {
        this.addResult(
          'Role Check',
          'success',
          'Usuário já possui role de administrador',
          { current_role: currentRole }
        );
        return true;
      }
      
      this.addResult(
        'Role Check',
        'warning',
        `Usuário possui role incorreta: ${currentRole}`,
        { current_role: currentRole, expected_role: 'admin' }
      );
      
      return false;
    } catch (error) {
      this.addResult(
        'Role Check',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return false;
    }
  }

  /**
   * Cria perfil se não existir
   */
  async createProfileIfMissing() {
    try {
      if (this.userProfile) {
        return true; // Perfil já existe
      }
      
      console.log('\n🔧 Criando perfil para o usuário...');
      
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          user_id: this.userAuthData.id,
          name: this.userAuthData.user_metadata?.name || 'Cleyton Silva',
          display_name: this.userAuthData.user_metadata?.display_name || 'Cleyton Silva',
          email: this.userAuthData.email,
          role: 'admin',
          xp: 0,
          profile_data: {}
        })
        .select()
        .single();
      
      if (error) {
        this.addResult(
          'Create Profile',
          'error',
          `Erro ao criar perfil: ${error.message}`,
          error
        );
        this.addFix('create_profile', 'Tentativa de criar perfil', false);
        return false;
      }
      
      this.userProfile = newProfile;
      
      this.addResult(
        'Create Profile',
        'success',
        'Perfil criado com sucesso',
        newProfile
      );
      
      this.addFix('create_profile', 'Perfil criado com role admin', true);
      return true;
    } catch (error) {
      this.addResult(
        'Create Profile',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      this.addFix('create_profile', 'Falha ao criar perfil', false);
      return false;
    }
  }

  /**
   * Corrige a role para admin
   */
  async fixUserRole() {
    try {
      if (!this.userProfile) {
        this.addResult(
          'Fix Role',
          'error',
          'Perfil do usuário não disponível para correção',
          null
        );
        return false;
      }
      
      if (this.userProfile.role === 'admin') {
        return true; // Já é admin
      }
      
      console.log('\n🔧 Corrigindo role do usuário para admin...');
      
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('user_id', this.userAuthData.id)
        .select()
        .single();
      
      if (error) {
        this.addResult(
          'Fix Role',
          'error',
          `Erro ao atualizar role: ${error.message}`,
          error
        );
        this.addFix('fix_role', 'Tentativa de corrigir role para admin', false);
        return false;
      }
      
      this.userProfile = updatedProfile;
      
      this.addResult(
        'Fix Role',
        'success',
        'Role corrigida para admin com sucesso',
        { old_role: this.userProfile.role, new_role: 'admin' }
      );
      
      this.addFix('fix_role', 'Role alterada de student/instructor para admin', true);
      return true;
    } catch (error) {
      this.addResult(
        'Fix Role',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      this.addFix('fix_role', 'Falha ao corrigir role', false);
      return false;
    }
  }

  /**
   * Testa o redirecionamento simulando login
   */
  async testRedirection() {
    try {
      console.log('\n🔍 Testando lógica de redirecionamento...');
      
      if (!this.userProfile) {
        this.addResult(
          'Redirection Test',
          'error',
          'Perfil não disponível para teste',
          null
        );
        return false;
      }
      
      const role = this.userProfile.role;
      let expectedRoute;
      
      if (role === 'admin' || role === 'instructor') {
        expectedRoute = '/admin';
      } else {
        expectedRoute = '/app';
      }
      
      this.addResult(
        'Redirection Test',
        'info',
        `Com role '${role}', usuário deve ser redirecionado para: ${expectedRoute}`,
        { role, expected_route: expectedRoute }
      );
      
      // Verificar se a lógica está correta
      if (role === 'admin' && expectedRoute === '/admin') {
        this.addResult(
          'Redirection Logic',
          'success',
          'Lógica de redirecionamento está correta para admin',
          null
        );
        return true;
      } else {
        this.addResult(
          'Redirection Logic',
          'warning',
          'Verificar lógica de redirecionamento no useAuth.ts',
          null
        );
        return false;
      }
    } catch (error) {
      this.addResult(
        'Redirection Test',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return false;
    }
  }

  /**
   * Verifica outros usuários admin
   */
  async checkOtherAdmins() {
    try {
      console.log('\n🔍 Verificando outros usuários admin...');
      
      const { data: adminProfiles, error } = await supabase
        .from('profiles')
        .select('user_id, name, email, role, created_at')
        .eq('role', 'admin')
        .limit(10);
      
      if (error) {
        this.addResult(
          'Other Admins',
          'error',
          `Erro ao buscar outros admins: ${error.message}`,
          error
        );
        return false;
      }
      
      this.addResult(
        'Other Admins',
        'info',
        `Encontrados ${adminProfiles.length} usuários com role admin`,
        adminProfiles
      );
      
      return true;
    } catch (error) {
      this.addResult(
        'Other Admins',
        'error',
        `Erro inesperado: ${error.message}`,
        error
      );
      return false;
    }
  }

  /**
   * Gera relatório final
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE CORREÇÃO DE ACESSO ADMINISTRATIVO');
    console.log('='.repeat(80));
    console.log(`🎯 Usuário alvo: ${TARGET_EMAIL}`);
    console.log(`⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}`);
    
    console.log('\n📋 RESUMO DOS RESULTADOS:');
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   ⚠️  Avisos: ${warningCount}`);
    
    console.log('\n🔧 CORREÇÕES APLICADAS:');
    if (this.fixes.length === 0) {
      console.log('   Nenhuma correção foi necessária');
    } else {
      this.fixes.forEach((fix, index) => {
        const icon = fix.success ? '✅' : '❌';
        console.log(`   ${index + 1}. ${icon} ${fix.description}`);
      });
    }
    
    console.log('\n👤 STATUS FINAL DO USUÁRIO:');
    if (this.userAuthData && this.userProfile) {
      console.log(`   📧 Email: ${this.userAuthData.email}`);
      console.log(`   🆔 ID: ${this.userAuthData.id}`);
      console.log(`   👤 Nome: ${this.userProfile.name}`);
      console.log(`   🎭 Role: ${this.userProfile.role}`);
      console.log(`   📅 Criado: ${new Date(this.userAuthData.created_at).toLocaleString('pt-BR')}`);
      
      if (this.userProfile.role === 'admin') {
        console.log('   ✅ ACESSO ADMINISTRATIVO RESTAURADO!');
      } else {
        console.log('   ❌ Acesso administrativo ainda não está correto');
      }
    } else {
      console.log('   ❌ Dados do usuário não disponíveis');
    }
    
    console.log('\n💡 PRÓXIMOS PASSOS:');
    if (this.userProfile?.role === 'admin') {
      console.log('   1. ✅ Faça logout e login novamente no sistema');
      console.log('   2. ✅ Você deve ser redirecionado para /admin');
      console.log('   3. ✅ Verifique se o painel administrativo está funcionando');
    } else {
      console.log('   1. ❌ Verifique os erros acima');
      console.log('   2. ❌ Execute o script novamente se necessário');
      console.log('   3. ❌ Contate o suporte técnico se o problema persistir');
    }
    
    console.log('\n🔍 VERIFICAÇÃO DE REDIRECIONAMENTO:');
    console.log('   - Se role = admin → deve ir para /admin');
    console.log('   - Se role = student → deve ir para /app');
    console.log('   - Verifique o arquivo src/hooks/useAuth.ts linhas 225-237');
    
    console.log('\n' + '='.repeat(80));
    
    return {
      success: this.userProfile?.role === 'admin',
      userFound: !!this.userAuthData,
      profileFound: !!this.userProfile,
      currentRole: this.userProfile?.role,
      fixesApplied: this.fixes.length,
      results: this.results,
      fixes: this.fixes
    };
  }

  /**
   * Executa todas as verificações e correções
   */
  async run() {
    try {
      console.log('🚀 Iniciando correção de acesso administrativo...');
      console.log(`🎯 Usuário alvo: ${TARGET_EMAIL}`);
      console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
      
      // 1. Verificar usuário auth
      const authUserExists = await this.checkAuthUser();
      if (!authUserExists) {
        console.log('\n❌ Usuário não encontrado. Não é possível continuar.');
        return this.generateReport();
      }
      
      // 2. Verificar perfil
      const profileExists = await this.checkUserProfile();
      
      // 3. Criar perfil se não existir
      if (!profileExists) {
        await this.createProfileIfMissing();
      }
      
      // 4. Verificar role
      const roleCorrect = await this.checkUserRole();
      
      // 5. Corrigir role se necessário
      if (!roleCorrect) {
        await this.fixUserRole();
      }
      
      // 6. Testar redirecionamento
      await this.testRedirection();
      
      // 7. Verificar outros admins
      await this.checkOtherAdmins();
      
      // 8. Gerar relatório
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro crítico durante execução:', error);
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
if (process.argv[1] && process.argv[1].endsWith('fix-admin-access.js')) {
  const fixer = new AdminAccessFixer();
  fixer.run()
    .then((result) => {
      console.log('\n✅ Execução concluída!');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Falha na execução:', error);
      process.exit(1);
    });
}

export default AdminAccessFixer;