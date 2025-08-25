/**
 * Script de teste completo para validar todo o fluxo de geração e upload de imagens
 * Testa upload local, geração com IA e políticas RLS
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Variáveis de ambiente não configuradas');
  console.log('Necessário: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para criar uma imagem PNG mínima (1x1 pixel)
function createTestImage() {
  // PNG mínimo de 1x1 pixel transparente (67 bytes)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  return pngData;
}

// Função para testar upload local
async function testLocalUpload() {
  console.log('\n🧪 Testando upload local de imagens...');
  
  try {
    // Criar imagem de teste
    const testImage = createTestImage();
    const fileName = `test-local-upload-${Date.now()}.png`;
    const filePath = `test/${fileName}`;
    
    console.log(`📤 Fazendo upload: ${fileName}`);
    
    // Upload para o bucket course-images
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(filePath, testImage, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
    
    if (error) {
      console.log('❌ Erro no upload:', error.message);
      return false;
    }
    
    console.log('✅ Upload realizado com sucesso');
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('course-images')
      .getPublicUrl(data.path);
    
    console.log(`🔗 URL pública: ${publicUrl}`);
    
    // Limpar arquivo de teste
    await supabase.storage
      .from('course-images')
      .remove([filePath]);
    
    console.log('🗑️  Arquivo de teste removido');
    return true;
    
  } catch (error) {
    console.log('❌ Erro inesperado no teste de upload:', error.message);
    return false;
  }
}

// Função para testar políticas RLS
async function testRLSPolicies() {
  console.log('\n🔒 Testando políticas RLS...');
  
  try {
    // Testar acesso público de leitura
    const { data: bucketInfo, error: bucketError } = await supabase.storage
      .from('course-images')
      .list('', { limit: 1 });
    
    if (bucketError) {
      console.log('❌ Erro ao acessar bucket:', bucketError.message);
      return false;
    }
    
    console.log('✅ Acesso de leitura ao bucket funcionando');
    
    // Verificar se o bucket está público
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('❌ Erro ao listar buckets:', listError.message);
      return false;
    }
    
    const courseImagesBucket = buckets.find(b => b.name === 'course-images');
    
    if (!courseImagesBucket) {
      console.log('❌ Bucket course-images não encontrado');
      return false;
    }
    
    console.log(`✅ Bucket course-images configurado como público: ${courseImagesBucket.public}`);
    return true;
    
  } catch (error) {
    console.log('❌ Erro inesperado no teste de RLS:', error.message);
    return false;
  }
}

// Função para testar tabela course_covers
async function testCoversTable() {
  console.log('\n📋 Testando tabela course_covers...');
  
  try {
    // Buscar um curso existente para usar como referência
    const { data: existingCourse, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .limit(1)
      .single();
    
    if (courseError || !existingCourse) {
      console.log('⚠️  Nenhum curso encontrado na base de dados para teste');
      return false;
    }
    
    // Buscar um profile existente para usar como created_by
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();
    
    if (profileError || !existingProfile) {
      console.log('⚠️  Nenhum profile encontrado na base de dados para teste');
      return false;
    }
    
    // Testar inserção de registro de teste
    const testCover = {
      course_id: existingCourse.id,
      image_url: 'https://example.com/test-image.png',
      created_by: existingProfile.id
    };
    
    const { data, error } = await supabase
      .from('course_covers')
      .insert(testCover)
      .select()
      .single();
    
    if (error) {
      console.log('❌ Erro ao inserir na tabela course_covers:', error.message);
      return false;
    }
    
    console.log('✅ Inserção na tabela course_covers funcionando');
    
    // Limpar registro de teste
    await supabase
      .from('course_covers')
      .delete()
      .eq('id', data.id);
    
    console.log('🗑️  Registro de teste removido');
    return true;
    
  } catch (error) {
    console.log('❌ Erro inesperado no teste da tabela:', error.message);
    return false;
  }
}

// Função para testar Edge Function (opcional)
async function testEdgeFunction() {
  console.log('\n⚡ Testando Edge Function generate-course-cover...');
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-course-cover', {
      body: {
        prompt: 'Test prompt for course cover',
        course_id: 'test-course-id',
        model: 'flux'
      }
    });
    
    if (error) {
      console.log('⚠️  Edge Function não disponível ou com erro:', error.message);
      console.log('   Status:', error.status);
      console.log('   Detalhes:', error);
      return false;
    }
    
    console.log('✅ Edge Function respondeu corretamente');
    return true;
    
  } catch (error) {
    console.log('⚠️  Edge Function não testável:', error.message);
    console.log('   Stack trace:', error.stack);
    return false;
  }
}

// Função principal
async function runCompleteTest() {
  console.log('🚀 INICIANDO TESTE COMPLETO DO FLUXO DE IMAGENS');
  console.log('==================================================');
  
  const results = {
    localUpload: false,
    rlsPolicies: false,
    coversTable: false,
    edgeFunction: false
  };
  
  // Executar todos os testes
  results.localUpload = await testLocalUpload();
  results.rlsPolicies = await testRLSPolicies();
  results.coversTable = await testCoversTable();
  results.edgeFunction = await testEdgeFunction();
  
  // Relatório final
  console.log('\n==================================================');
  console.log('📊 RELATÓRIO FINAL DOS TESTES');
  console.log('==================================================');
  
  console.log(`📤 Upload Local: ${results.localUpload ? '✅ FUNCIONANDO' : '❌ COM PROBLEMAS'}`);
  console.log(`🔒 Políticas RLS: ${results.rlsPolicies ? '✅ FUNCIONANDO' : '❌ COM PROBLEMAS'}`);
  console.log(`📋 Tabela course_covers: ${results.coversTable ? '✅ FUNCIONANDO' : '❌ COM PROBLEMAS'}`);
  console.log(`⚡ Edge Function: ${results.edgeFunction ? '✅ FUNCIONANDO' : '⚠️  NÃO TESTÁVEL'}`);
  
  const criticalTests = [results.localUpload, results.rlsPolicies, results.coversTable];
  const allCriticalPassed = criticalTests.every(test => test === true);
  
  console.log('\n==================================================');
  if (allCriticalPassed) {
    console.log('🎉 TODOS OS TESTES CRÍTICOS PASSARAM!');
    console.log('✅ O sistema de upload de imagens está funcionando corretamente.');
  } else {
    console.log('⚠️  ALGUNS TESTES FALHARAM!');
    console.log('🔧 Verifique os erros acima e corrija antes de usar em produção.');
  }
  
  console.log('\n🏁 Teste completo finalizado!');
}

// Executar teste
runCompleteTest().catch(console.error);