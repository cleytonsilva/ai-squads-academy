import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ncrlojjfkhevjotchhxi.supabase.co';
// Chave anônima válida do Supabase (role: anon)
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTc3MjMsImV4cCI6MjA2OTc3MzcyM30.f3DPtL3s_J7vzk0JmYsfkbd7Yyx1IDpy1IN-k6cwiZY';

/**
 * Valida se uma string é um JWT válido
 * @param {string} token - Token a ser validado
 * @returns {boolean} - True se for um JWT válido
 */
function isValidJWT(token) {
  if (!token || typeof token !== 'string') {
    console.error('❌ Token inválido: deve ser uma string não vazia');
    return false;
  }

  // JWT deve ter exatamente 3 partes separadas por pontos
  const parts = token.split('.');
  if (parts.length !== 3) {
    console.error('❌ JWT inválido: deve ter exatamente 3 partes separadas por pontos');
    return false;
  }

  // Verifica se não há repetições excessivas de caracteres (alucinação)
  const hasExcessiveRepetition = /(.{3,})\1{10,}/.test(token);
  if (hasExcessiveRepetition) {
    console.error('❌ Token contém repetições excessivas de caracteres (possível alucinação)');
    return false;
  }

  try {
    // Tenta decodificar o header
    const header = JSON.parse(atob(parts[0]));
    if (!header.alg || !header.typ) {
      console.error('❌ Header JWT inválido: deve conter alg e typ');
      return false;
    }

    // Tenta decodificar o payload
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.iss || !payload.role) {
      console.error('❌ Payload JWT inválido: deve conter iss e role');
      return false;
    }

    console.log('✅ JWT válido:', {
      algorithm: header.alg,
      type: header.typ,
      issuer: payload.iss,
      role: payload.role,
      expires: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A'
    });

    return true;
  } catch (error) {
    console.error('❌ Erro ao decodificar JWT:', error.message);
    return false;
  }
}

/**
 * Testa a conexão com o Supabase usando permissões anônimas
 */
async function testAnonPermissions() {
  console.log('🔍 Iniciando teste de permissões anônimas...');
  
  // Valida a chave antes de usar
  if (!isValidJWT(anonKey)) {
    console.error('❌ Teste abortado: chave anônima inválida');
    return false;
  }

  try {
    // Cria cliente Supabase com chave anônima
    const supabase = createClient(supabaseUrl, anonKey);
    
    console.log('📡 Testando conexão com Supabase...');
    
    // Testa uma consulta simples que deve funcionar com permissões anônimas
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na consulta:', error.message);
      return false;
    }
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('📊 Dados retornados:', data);
    
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    return false;
  }
}

/**
 * Função principal para executar todos os testes
 */
async function runTests() {
  console.log('🚀 Executando testes de permissões anônimas do Supabase');
  console.log('=' .repeat(60));
  
  const success = await testAnonPermissions();
  
  console.log('=' .repeat(60));
  console.log(success ? '✅ Todos os testes passaram!' : '❌ Alguns testes falharam!');
  
  return success;
}

// Executa os testes se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testAnonPermissions, isValidJWT, runTests };
