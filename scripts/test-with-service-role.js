/**
 * Script para testar a Edge Function com service role key
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testWithServiceRole() {
  try {
    // Configurar cliente Supabase com service role
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variáveis de ambiente não configuradas:');
      console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
      console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('🔍 Testando Edge Function com service role key...');
    
    // Buscar um curso existente
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, title, description')
      .limit(1);
    
    if (coursesError) {
      console.error('❌ Erro ao buscar cursos:', coursesError);
      return;
    }
    
    if (!courses || courses.length === 0) {
      console.log('⚠️  Nenhum curso encontrado');
      return;
    }
    
    const course = courses[0];
    console.log('✅ Curso encontrado:', { id: course.id, title: course.title });
    
    const testData = {
      courseId: course.id,
      engine: 'flux',
      regenerate: true
    };
    
    console.log('📤 Chamando Edge Function com service role...');
    
    const { data, error } = await supabase.functions.invoke('generate-course-cover', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Erro na Edge Function:');
      console.error('- Message:', error.message);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);
      console.error('- Code:', error.code);
      
      // Fazer uma requisição HTTP direta para obter mais detalhes
      console.log('\n🔍 Fazendo requisição HTTP direta para mais detalhes...');
      
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-course-cover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify(testData)
        });
        
        console.log('📡 Status HTTP:', response.status);
        console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📄 Resposta completa:', responseText);
        
        if (response.status >= 400) {
          try {
            const errorData = JSON.parse(responseText);
            console.log('🔍 Detalhes do erro:', errorData);
          } catch (e) {
            console.log('📄 Resposta não é JSON válido');
          }
        }
        
      } catch (fetchError) {
        console.error('❌ Erro na requisição HTTP:', fetchError);
      }
      
    } else {
      console.log('✅ Edge Function executada com sucesso!');
      console.log('📋 Resposta:', JSON.stringify(data, null, 2));
    }
    
    // Verificar variáveis de ambiente necessárias
    console.log('\n🔧 Verificando configuração de variáveis de ambiente...');
    
    const requiredEnvVars = [
      'REPLICATE_API_TOKEN',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SUPABASE_URL'
    ];
    
    console.log('📋 Variáveis locais:');
    requiredEnvVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`- ${varName}: ${value ? '✅ Configurada' : '❌ Não configurada'}`);
    });
    
    console.log('\n💡 Nota: As variáveis de ambiente da Edge Function são configuradas');
    console.log('   separadamente no painel do Supabase em Project Settings > Edge Functions');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar teste
testWithServiceRole();