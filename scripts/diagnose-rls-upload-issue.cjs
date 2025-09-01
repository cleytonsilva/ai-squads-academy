/**
 * Script de Diagnóstico: Problema de RLS no Upload Manual de Capas
 * 
 * Este script diagnostica problemas de Row Level Security (RLS) no upload
 * manual de capas de cursos através do CourseCoverManager.
 * 
 * Erro específico: 'StorageApiError: new row violates row-level security policy'
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

// Cliente com ANON_KEY (usado pelo frontend)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente com SERVICE_ROLE (para comparação)
const supabaseAdmin = SUPABASE_SERVICE_ROLE 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  : null;

/**
 * Estrutura do relatório de diagnóstico
 */
const diagnosticReport = {
  timestamp: new Date().toISOString(),
  error: 'StorageApiError: new row violates row-level security policy',
  tests: [],
  summary: {
    authStatus: null,
    userRole: null,
    rlsPolicies: null,
    profilesAccess: null,
    recommendations: []
  }
};

/**
 * Adiciona resultado de teste ao relatório
 */
function addTestResult(testName, status, details, error = null) {
  const result = {
    test: testName,
    status, // 'PASS', 'FAIL', 'WARNING'
    details,
    error: error?.message || null,
    timestamp: new Date().toISOString()
  };
  
  diagnosticReport.tests.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${details}`);
  
  if (error) {
    console.log(`   Erro: ${error.message}`);
  }
}

/**
 * Teste 1: Verificar autenticação do usuário
 */
async function testUserAuthentication() {
  console.log('\n🔍 Teste 1: Verificando autenticação do usuário...');
  
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error) {
      addTestResult(
        'Autenticação do Usuário',
        'FAIL',
        'Erro ao obter dados do usuário autenticado',
        error
      );
      diagnosticReport.summary.authStatus = 'FAILED';
      return null;
    }
    
    if (!user) {
      addTestResult(
        'Autenticação do Usuário',
        'FAIL',
        'Usuário não está autenticado'
      );
      diagnosticReport.summary.authStatus = 'NOT_AUTHENTICATED';
      return null;
    }
    
    addTestResult(
      'Autenticação do Usuário',
      'PASS',
      `Usuário autenticado: ${user.email} (ID: ${user.id})`
    );
    diagnosticReport.summary.authStatus = 'AUTHENTICATED';
    return user;
    
  } catch (error) {
    addTestResult(
      'Autenticação do Usuário',
      'FAIL',
      'Erro inesperado na verificação de autenticação',
      error
    );
    diagnosticReport.summary.authStatus = 'ERROR';
    return null;
  }
}

/**
 * Teste 2: Verificar role do usuário no perfil
 */
async function testUserRole(user) {
  console.log('\n🔍 Teste 2: Verificando role do usuário...');
  
  if (!user) {
    addTestResult(
      'Role do Usuário',
      'FAIL',
      'Não é possível verificar role - usuário não autenticado'
    );
    return null;
  }
  
  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('id, role, user_id')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      addTestResult(
        'Role do Usuário',
        'FAIL',
        'Erro ao buscar perfil do usuário',
        error
      );
      diagnosticReport.summary.userRole = 'ERROR';
      return null;
    }
    
    if (!profile) {
      addTestResult(
        'Role do Usuário',
        'FAIL',
        'Perfil do usuário não encontrado na tabela profiles'
      );
      diagnosticReport.summary.userRole = 'NOT_FOUND';
      return null;
    }
    
    const isAuthorized = ['admin', 'instructor'].includes(profile.role);
    
    addTestResult(
      'Role do Usuário',
      isAuthorized ? 'PASS' : 'FAIL',
      `Role encontrada: '${profile.role}' ${isAuthorized ? '(autorizada)' : '(não autorizada para upload)'}`
    );
    
    diagnosticReport.summary.userRole = profile.role;
    return profile;
    
  } catch (error) {
    addTestResult(
      'Role do Usuário',
      'FAIL',
      'Erro inesperado na verificação de role',
      error
    );
    diagnosticReport.summary.userRole = 'ERROR';
    return null;
  }
}

/**
 * Teste 3: Verificar políticas RLS do storage
 */
async function testStorageRLSPolicies() {
  console.log('\n🔍 Teste 3: Verificando políticas RLS do storage...');
  
  try {
    // Verificar se o bucket existe
    const { data: buckets, error: bucketsError } = await supabaseClient.storage.listBuckets();
    
    if (bucketsError) {
      addTestResult(
        'Verificação do Bucket',
        'FAIL',
        'Erro ao listar buckets',
        bucketsError
      );
      return;
    }
    
    const courseImagesBucket = buckets.find(bucket => bucket.id === 'course-images');
    
    if (!courseImagesBucket) {
      addTestResult(
        'Verificação do Bucket',
        'FAIL',
        'Bucket course-images não encontrado'
      );
      return;
    }
    
    addTestResult(
      'Verificação do Bucket',
      'PASS',
      `Bucket course-images encontrado (público: ${courseImagesBucket.public})`
    );
    
    // Tentar listar arquivos (teste de leitura)
    const { data: files, error: listError } = await supabaseClient.storage
      .from('course-images')
      .list('', { limit: 1 });
    
    if (listError) {
      addTestResult(
        'Política de Leitura',
        'FAIL',
        'Erro ao listar arquivos do bucket',
        listError
      );
    } else {
      addTestResult(
        'Política de Leitura',
        'PASS',
        'Leitura do bucket funcionando corretamente'
      );
    }
    
    // Simular upload (teste de escrita) - usando arquivo pequeno
    const testFile = new Blob(['test'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('course-images')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      addTestResult(
        'Política de Upload',
        'FAIL',
        'Upload falhou - confirma problema de RLS',
        uploadError
      );
      diagnosticReport.summary.rlsPolicies = 'BLOCKING_UPLOAD';
    } else {
      addTestResult(
        'Política de Upload',
        'PASS',
        'Upload funcionando - problema pode estar em outro lugar'
      );
      
      // Limpar arquivo de teste
      await supabaseClient.storage
        .from('course-images')
        .remove([testFileName]);
        
      diagnosticReport.summary.rlsPolicies = 'WORKING';
    }
    
  } catch (error) {
    addTestResult(
      'Políticas RLS do Storage',
      'FAIL',
      'Erro inesperado na verificação de políticas',
      error
    );
    diagnosticReport.summary.rlsPolicies = 'ERROR';
  }
}

/**
 * Teste 4: Verificar acesso à tabela profiles
 */
async function testProfilesTableAccess() {
  console.log('\n🔍 Teste 4: Verificando acesso à tabela profiles...');
  
  try {
    // Tentar contar registros na tabela profiles
    const { count, error } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      addTestResult(
        'Acesso à Tabela Profiles',
        'FAIL',
        'Erro ao acessar tabela profiles',
        error
      );
      diagnosticReport.summary.profilesAccess = 'ERROR';
      return;
    }
    
    addTestResult(
      'Acesso à Tabela Profiles',
      'PASS',
      `Tabela profiles acessível (${count} registros)`
    );
    diagnosticReport.summary.profilesAccess = 'WORKING';
    
  } catch (error) {
    addTestResult(
      'Acesso à Tabela Profiles',
      'FAIL',
      'Erro inesperado no acesso à tabela profiles',
      error
    );
    diagnosticReport.summary.profilesAccess = 'ERROR';
  }
}

/**
 * Teste 5: Comparar com service role (se disponível)
 */
async function testServiceRoleComparison() {
  console.log('\n🔍 Teste 5: Comparando com service role...');
  
  if (!supabaseAdmin) {
    addTestResult(
      'Comparação Service Role',
      'WARNING',
      'SUPABASE_SERVICE_ROLE_KEY não configurada - pulando teste'
    );
    return;
  }
  
  try {
    // Tentar upload com service role
    const testFile = new Blob(['test-service'], { type: 'text/plain' });
    const testFileName = `test-service-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('course-images')
      .upload(testFileName, testFile);
    
    if (uploadError) {
      addTestResult(
        'Upload com Service Role',
        'FAIL',
        'Upload falhou mesmo com service role',
        uploadError
      );
    } else {
      addTestResult(
        'Upload com Service Role',
        'PASS',
        'Upload funcionou com service role - problema é de permissão de usuário'
      );
      
      // Limpar arquivo de teste
      await supabaseAdmin.storage
        .from('course-images')
        .remove([testFileName]);
    }
    
  } catch (error) {
    addTestResult(
      'Comparação Service Role',
      'FAIL',
      'Erro inesperado no teste com service role',
      error
    );
  }
}

/**
 * Gerar recomendações baseadas nos resultados
 */
function generateRecommendations() {
  console.log('\n📋 Gerando recomendações...');
  
  const recommendations = [];
  
  // Baseado no status de autenticação
  if (diagnosticReport.summary.authStatus !== 'AUTHENTICATED') {
    recommendations.push('Verificar se o usuário está logado corretamente');
  }
  
  // Baseado na role do usuário
  if (diagnosticReport.summary.userRole && !['admin', 'instructor'].includes(diagnosticReport.summary.userRole)) {
    recommendations.push(`Usuário tem role '${diagnosticReport.summary.userRole}' - apenas 'admin' e 'instructor' podem fazer upload`);
    recommendations.push('Verificar se o usuário deveria ter role admin/instructor ou se as políticas RLS precisam ser ajustadas');
  }
  
  if (diagnosticReport.summary.userRole === 'NOT_FOUND') {
    recommendations.push('Criar perfil para o usuário na tabela profiles');
  }
  
  // Baseado nas políticas RLS
  if (diagnosticReport.summary.rlsPolicies === 'BLOCKING_UPLOAD') {
    recommendations.push('As políticas RLS estão bloqueando o upload - verificar políticas do bucket course-images');
    recommendations.push('Considerar adicionar política que permita upload para usuários autenticados com role admin/instructor');
  }
  
  // Baseado no acesso à tabela profiles
  if (diagnosticReport.summary.profilesAccess === 'ERROR') {
    recommendations.push('Verificar políticas RLS da tabela profiles');
    recommendations.push('Verificar se a tabela profiles existe e está acessível');
  }
  
  // Recomendações gerais
  if (recommendations.length === 0) {
    recommendations.push('Todos os testes básicos passaram - investigar logs detalhados do erro');
    recommendations.push('Verificar se o problema ocorre apenas com arquivos específicos ou tamanhos');
  }
  
  diagnosticReport.summary.recommendations = recommendations;
  
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec}`);
  });
}

/**
 * Salvar relatório em arquivo
 */
function saveReport() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `rls-diagnostic-report-${timestamp}.json`;
  const filepath = path.join(process.cwd(), 'scripts', filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(diagnosticReport, null, 2));
    console.log(`\n📄 Relatório salvo em: ${filepath}`);
  } catch (error) {
    console.error(`❌ Erro ao salvar relatório: ${error.message}`);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 DIAGNÓSTICO: Problema de RLS no Upload Manual de Capas');
  console.log('=' .repeat(60));
  
  try {
    // Executar todos os testes
    const user = await testUserAuthentication();
    const profile = await testUserRole(user);
    await testStorageRLSPolicies();
    await testProfilesTableAccess();
    await testServiceRoleComparison();
    
    // Gerar recomendações
    generateRecommendations();
    
    // Salvar relatório
    saveReport();
    
    console.log('\n✅ Diagnóstico concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error);
    process.exit(1);
  }
}

// Executar diagnóstico
main();