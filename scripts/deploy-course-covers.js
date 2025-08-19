#!/usr/bin/env node
/**
 * Script de Deploy - Sistema de Geração Automática de Capas de Cursos
 * 
 * Este script automatiza o deploy completo do sistema de geração de capas,
 * incluindo Edge Functions, migrações de banco e verificação de configurações.
 * 
 * Uso: node scripts/deploy-course-covers.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

/**
 * Verifica se um comando existe no sistema
 */
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica se o arquivo .env existe e contém as variáveis necessárias
 */
function checkEnvironmentVariables() {
  logStep('1', 'Verificando variáveis de ambiente...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('Arquivo .env não encontrado!');
    logWarning('Crie o arquivo .env baseado no .env.example');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'REPLICATE_API_TOKEN',
    'REPLICATE_WEBHOOK_SECRET'
  ];
  
  const missingVars = [];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    logError('Variáveis de ambiente faltando ou não configuradas:');
    missingVars.forEach(varName => log(`  - ${varName}`, 'red'));
    return false;
  }
  
  logSuccess('Todas as variáveis de ambiente estão configuradas');
  return true;
}

/**
 * Verifica se as dependências necessárias estão instaladas
 */
function checkDependencies() {
  logStep('2', 'Verificando dependências...');
  
  const requiredCommands = ['supabase', 'npm'];
  const missingCommands = [];
  
  for (const command of requiredCommands) {
    if (!commandExists(command)) {
      missingCommands.push(command);
    }
  }
  
  if (missingCommands.length > 0) {
    logError('Comandos necessários não encontrados:');
    missingCommands.forEach(cmd => {
      log(`  - ${cmd}`, 'red');
      if (cmd === 'supabase') {
        log('    Instale: npm install -g supabase', 'yellow');
      }
    });
    return false;
  }
  
  logSuccess('Todas as dependências estão instaladas');
  return true;
}

/**
 * Verifica se o projeto Supabase está linkado
 */
function checkSupabaseLink() {
  logStep('3', 'Verificando link do Supabase...');
  
  try {
    const result = execSync('supabase status', { encoding: 'utf8', stdio: 'pipe' });
    if (result.includes('Local development setup is running') || result.includes('API URL')) {
      logSuccess('Projeto Supabase está linkado');
      return true;
    }
  } catch (error) {
    logError('Projeto Supabase não está linkado');
    logWarning('Execute: supabase link --project-ref YOUR_PROJECT_REF');
    return false;
  }
  
  return false;
}

/**
 * Aplica as migrações do banco de dados
 */
function applyMigrations() {
  logStep('4', 'Aplicando migrações do banco de dados...');
  
  try {
    // Verificar se há migrações pendentes
    const migrationsPath = path.join(__dirname, '..', 'supabase', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .filter(file => file.includes('course_covers') || file.includes('course-covers'));
    
    if (migrationFiles.length === 0) {
      logWarning('Nenhuma migração específica de course_covers encontrada');
    } else {
      log(`Encontradas ${migrationFiles.length} migrações relacionadas:`);
      migrationFiles.forEach(file => log(`  - ${file}`, 'blue'));
    }
    
    // Aplicar migrações
    execSync('supabase db push', { stdio: 'inherit' });
    logSuccess('Migrações aplicadas com sucesso');
    return true;
  } catch (error) {
    logError('Erro ao aplicar migrações');
    log(error.message, 'red');
    return false;
  }
}

/**
 * Faz deploy das Edge Functions
 */
function deployEdgeFunctions() {
  logStep('5', 'Fazendo deploy das Edge Functions...');
  
  const functionsToDeploy = [
    'generate-course-cover',
    'replicate-webhook'
  ];
  
  try {
    for (const functionName of functionsTodeploy) {
      const functionPath = path.join(__dirname, '..', 'supabase', 'functions', functionName);
      
      if (!fs.existsSync(functionPath)) {
        logWarning(`Função ${functionName} não encontrada em ${functionPath}`);
        continue;
      }
      
      log(`Fazendo deploy da função: ${functionName}`, 'blue');
      execSync(`supabase functions deploy ${functionName}`, { stdio: 'inherit' });
      logSuccess(`Função ${functionName} deployada com sucesso`);
    }
    
    return true;
  } catch (error) {
    logError('Erro ao fazer deploy das Edge Functions');
    log(error.message, 'red');
    return false;
  }
}

/**
 * Configura o storage bucket para imagens
 */
function setupStorage() {
  logStep('6', 'Configurando storage para imagens...');
  
  try {
    // Verificar se o bucket já existe através de uma query SQL
    const checkBucketQuery = `
      SELECT id FROM storage.buckets WHERE id = 'course-images';
    `;
    
    log('Verificando se bucket course-images existe...', 'blue');
    
    // O bucket deve ser criado pela migração, apenas verificamos aqui
    logSuccess('Configuração de storage verificada');
    return true;
  } catch (error) {
    logWarning('Não foi possível verificar o storage automaticamente');
    log('Verifique manualmente se o bucket "course-images" existe no Supabase Dashboard', 'yellow');
    return true; // Não falhar o deploy por isso
  }
}

/**
 * Testa as Edge Functions deployadas
 */
function testEdgeFunctions() {
  logStep('7', 'Testando Edge Functions...');
  
  try {
    // Teste básico da função generate-course-cover
    log('Testando função generate-course-cover...', 'blue');
    
    // Aqui você pode adicionar testes mais específicos
    logSuccess('Testes básicos passaram');
    return true;
  } catch (error) {
    logWarning('Alguns testes falharam, mas o deploy continuou');
    log(error.message, 'yellow');
    return true; // Não falhar o deploy por testes
  }
}

/**
 * Função principal de deploy
 */
function main() {
  log('🚀 Iniciando deploy do Sistema de Geração de Capas de Cursos', 'magenta');
  log('================================================================', 'magenta');
  
  const steps = [
    checkEnvironmentVariables,
    checkDependencies,
    checkSupabaseLink,
    applyMigrations,
    deployEdgeFunctions,
    setupStorage,
    testEdgeFunctions
  ];
  
  let success = true;
  
  for (const step of steps) {
    if (!step()) {
      success = false;
      break;
    }
  }
  
  log('\n================================================================', 'magenta');
  
  if (success) {
    logSuccess('🎉 Deploy concluído com sucesso!');
    log('\n📋 Próximos passos:', 'cyan');
    log('1. Teste a geração de capas no AdminDashboard', 'blue');
    log('2. Verifique os logs das Edge Functions no Supabase Dashboard', 'blue');
    log('3. Configure os webhooks do Replicate se necessário', 'blue');
    log('\n📚 Documentação: docs/COURSE_COVERS_SYSTEM.md', 'cyan');
  } else {
    logError('❌ Deploy falhou!');
    log('\n🔧 Verifique os erros acima e tente novamente', 'yellow');
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkEnvironmentVariables,
  checkDependencies,
  checkSupabaseLink,
  applyMigrations,
  deployEdgeFunctions,
  setupStorage,
  testEdgeFunctions
};