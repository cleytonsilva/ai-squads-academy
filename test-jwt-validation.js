// Teste simples de validação JWT
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxOTc3MjMsImV4cCI6MjA2OTc3MzcyM30.f3DPtL3s_J7vzk0JmYsfkbd7Yyx1IDpy1IN-k6cwiZY';

/**
 * Valida se uma string é um JWT válido
 * @param {string} token - Token a ser validado
 * @returns {boolean} - True se for um JWT válido
 */
function isValidJWT(token) {
  console.log('🔍 Validando JWT...');
  
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

// Teste da validação
console.log('🚀 Iniciando teste de validação JWT');
console.log('=' .repeat(50));

const isValid = isValidJWT(anonKey);

console.log('=' .repeat(50));
console.log(isValid ? '✅ Validação bem-sucedida!' : '❌ Validação falhou!');

// Teste com token inválido (repetição excessiva)
const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8.signature';
console.log('\n🧪 Testando token com repetição excessiva:');
const isInvalid = isValidJWT(invalidToken);
console.log(isInvalid ? '❌ Erro: token inválido foi aceito!' : '✅ Token inválido rejeitado corretamente!');