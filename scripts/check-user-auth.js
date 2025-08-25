/**
 * Script para verificar autenticação e permissões do usuário atual
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserAuth() {
  try {
    // Configurar cliente Supabase com anon key (como no frontend)
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Variáveis de ambiente não configuradas');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    console.log('🔍 Verificando autenticação atual...');
    
    // Verificar se há usuário logado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Nenhum usuário autenticado');
      console.log('💡 Para testar a geração de imagens, você precisa:');
      console.log('   1. Fazer login no sistema');
      console.log('   2. Ter role "admin" ou "instructor"');
      
      // Verificar se existem usuários admin
      console.log('\n🔍 Verificando usuários admin existentes...');
      
      const supabaseService = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: adminUsers, error: adminError } = await supabaseService
        .from('profiles')
        .select('user_id, role, created_at')
        .in('role', ['admin', 'instructor'])
        .limit(5);
      
      if (adminError) {
        console.error('❌ Erro ao buscar usuários admin:', adminError);
      } else if (adminUsers && adminUsers.length > 0) {
        console.log('✅ Usuários admin/instructor encontrados:', adminUsers.length);
        console.log('📋 Primeiros usuários:');
        adminUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. Role: ${user.role}, Criado: ${new Date(user.created_at).toLocaleDateString()}`);
        });
      } else {
        console.log('⚠️  Nenhum usuário admin/instructor encontrado');
        console.log('💡 Você pode criar um usuário admin através do painel do Supabase');
      }
      
      return;
    }
    
    console.log('✅ Usuário autenticado:');
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Criado: ${new Date(user.created_at).toLocaleDateString()}`);
    
    // Verificar perfil e role
    console.log('\n🔍 Verificando perfil e permissões...');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, created_at')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      console.log('💡 O perfil pode não ter sido criado automaticamente');
      
      // Tentar criar perfil
      console.log('🔧 Tentando criar perfil...');
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          role: 'student' // Role padrão
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar perfil:', createError);
      } else {
        console.log('✅ Perfil criado:', newProfile);
      }
      
      return;
    }
    
    if (!profile) {
      console.log('❌ Perfil não encontrado');
      return;
    }
    
    console.log('✅ Perfil encontrado:');
    console.log(`   - Role: ${profile.role}`);
    console.log(`   - Criado: ${new Date(profile.created_at).toLocaleDateString()}`);
    
    // Verificar se tem permissão para gerar imagens
    const hasPermission = ['admin', 'instructor'].includes(profile.role);
    
    if (hasPermission) {
      console.log('\n✅ Usuário tem permissão para gerar imagens!');
      console.log('🎯 Você pode testar a geração de capas no sistema');
      
      // Testar a geração de imagem
      console.log('\n🧪 Testando geração de imagem...');
      
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title')
        .limit(1);
      
      if (courses && courses.length > 0) {
        const course = courses[0];
        console.log(`📋 Testando com curso: ${course.title}`);
        
        const { data, error } = await supabase.functions.invoke('generate-course-cover', {
          body: {
            courseId: course.id,
            engine: 'flux',
            regenerate: true
          }
        });
        
        if (error) {
          console.error('❌ Erro na geração:', error.message);
        } else {
          console.log('✅ Geração iniciada com sucesso!');
          console.log('📋 Resposta:', data);
        }
      }
      
    } else {
      console.log('\n❌ Usuário NÃO tem permissão para gerar imagens');
      console.log(`   Role atual: ${profile.role}`);
      console.log('   Roles necessários: admin, instructor');
      console.log('\n💡 Para obter permissão:');
      console.log('   1. Contate um administrador');
      console.log('   2. Ou atualize sua role no painel do Supabase');
    }
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar verificação
checkUserAuth();