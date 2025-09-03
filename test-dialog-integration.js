import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente com anon key para simular o comportamento do frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

class DialogIntegrationTester {
  constructor() {
    this.testResults = {
      edgeFunction: false,
      dialogSimulation: false,
      errorHandling: false,
      responseFormat: false
    };
  }

  async testEdgeFunctionAccess() {
    console.log('🔐 Testando acesso à edge function com chave anônima...');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-extend-module', {
        body: {
          html: '<p>Teste de acesso</p>',
          moduleTitle: 'Teste',
          prompt: 'Expandir',
          length: 'short',
          tone: 'casual'
        }
      });
      
      if (error) {
        console.error('❌ Erro de acesso:', error);
        return false;
      }
      
      if (data && data.extendedHtml) {
        console.log('✅ Acesso à edge function funcionando');
        this.testResults.edgeFunction = true;
        return true;
      }
      
      console.error('❌ Resposta inválida da edge function');
      return false;
      
    } catch (error) {
      console.error('❌ Erro ao acessar edge function:', error.message);
      return false;
    }
  }

  async simulateDialogBehavior() {
    console.log('\n🎭 Simulando comportamento do AIModuleExtendDialog...');
    
    // Simular dados que o dialog enviaria
    const dialogData = {
      moduleTitle: 'Introdução ao JavaScript',
      currentHtml: '<p>JavaScript é uma linguagem de programação.</p><p>É amplamente utilizada no desenvolvimento web.</p>',
      prompt: 'Adicione informações sobre sintaxe básica e exemplos de código',
      length: 'medium',
      tone: 'educational'
    };
    
    console.log('📤 Dados do dialog:', {
      moduleTitle: dialogData.moduleTitle,
      htmlLength: dialogData.currentHtml.length,
      prompt: dialogData.prompt,
      length: dialogData.length,
      tone: dialogData.tone
    });
    
    try {
      const startTime = Date.now();
      
      // Simular a chamada exata que o dialog faz
      const { data, error } = await supabase.functions.invoke('ai-extend-module', {
        body: {
          html: dialogData.currentHtml,
          moduleTitle: dialogData.moduleTitle,
          prompt: dialogData.prompt,
          length: dialogData.length,
          tone: dialogData.tone
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error('❌ Erro na simulação do dialog:', error);
        return false;
      }
      
      if (!data || !data.extendedHtml) {
        console.error('❌ Resposta inválida do dialog');
        return false;
      }
      
      console.log('✅ Simulação do dialog bem-sucedida:', {
        duration: `${duration}ms`,
        originalLength: dialogData.currentHtml.length,
        extendedLength: data.extendedHtml.length,
        hasValidHtml: data.extendedHtml.includes('<p>') || data.extendedHtml.includes('<div>')
      });
      
      // Verificar se o conteúdo estendido é válido
      if (data.extendedHtml.length > dialogData.currentHtml.length) {
        console.log('✅ Conteúdo foi expandido corretamente');
        this.testResults.dialogSimulation = true;
        return data.extendedHtml;
      } else {
        console.log('⚠️ Conteúdo não foi expandido');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro na simulação:', error.message);
      return false;
    }
  }

  async testErrorHandling() {
    console.log('\n🚨 Testando tratamento de erros...');
    
    const errorTests = [
      {
        name: 'HTML vazio',
        data: { html: '', moduleTitle: 'Teste', prompt: 'Expandir', length: 'short', tone: 'casual' }
      },
      {
        name: 'Prompt vazio',
        data: { html: '<p>Teste</p>', moduleTitle: 'Teste', prompt: '', length: 'short', tone: 'casual' }
      },
      {
        name: 'Parâmetros inválidos',
        data: { html: '<p>Teste</p>', moduleTitle: 'Teste', prompt: 'Expandir', length: 'invalid', tone: 'invalid' }
      }
    ];
    
    let errorHandlingWorks = true;
    
    for (const test of errorTests) {
      console.log(`📋 Testando: ${test.name}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('ai-extend-module', {
          body: test.data
        });
        
        if (error) {
          console.log(`✅ ${test.name} - Erro tratado corretamente:`, error.message);
        } else if (data && data.extendedHtml) {
          console.log(`✅ ${test.name} - Processado com sucesso (${data.extendedHtml.length} chars)`);
        } else {
          console.log(`⚠️ ${test.name} - Resposta inesperada`);
          errorHandlingWorks = false;
        }
        
      } catch (error) {
        console.log(`✅ ${test.name} - Exceção capturada:`, error.message);
      }
    }
    
    this.testResults.errorHandling = errorHandlingWorks;
    return errorHandlingWorks;
  }

  async testResponseFormat() {
    console.log('\n📋 Testando formato da resposta...');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-extend-module', {
        body: {
          html: '<p>Teste de formato</p>',
          moduleTitle: 'Teste de Formato',
          prompt: 'Adicionar mais conteúdo',
          length: 'short',
          tone: 'casual'
        }
      });
      
      if (error) {
        console.error('❌ Erro no teste de formato:', error);
        return false;
      }
      
      console.log('📥 Analisando resposta:');
      console.log('- Tipo de dados:', typeof data);
      console.log('- É objeto:', data && typeof data === 'object');
      console.log('- Tem extendedHtml:', 'extendedHtml' in data);
      console.log('- Tipo do extendedHtml:', typeof data.extendedHtml);
      console.log('- É string válida:', typeof data.extendedHtml === 'string' && data.extendedHtml.length > 0);
      
      // Verificar se é HTML válido
      const hasHtmlTags = /<[^>]+>/.test(data.extendedHtml);
      console.log('- Contém tags HTML:', hasHtmlTags);
      
      // Verificar estrutura esperada pelo frontend
      const isValidFormat = (
        data &&
        typeof data === 'object' &&
        'extendedHtml' in data &&
        typeof data.extendedHtml === 'string' &&
        data.extendedHtml.length > 0
      );
      
      if (isValidFormat) {
        console.log('✅ Formato da resposta está correto');
        this.testResults.responseFormat = true;
        return true;
      } else {
        console.log('❌ Formato da resposta está incorreto');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Erro no teste de formato:', error.message);
      return false;
    }
  }

  async simulateOnExtendedCallback(extendedHtml) {
    console.log('\n🔄 Simulando callback onExtended do AdminCourseEditor...');
    
    // Simular o que acontece quando o dialog chama onExtended
    console.log('📤 Dados que seriam passados para onExtended:', {
      type: typeof extendedHtml,
      length: extendedHtml ? extendedHtml.length : 0,
      isString: typeof extendedHtml === 'string',
      hasContent: extendedHtml && extendedHtml.length > 0
    });
    
    // Simular a lógica do AdminCourseEditor.onExtended
    if (typeof extendedHtml === 'string' && extendedHtml.length > 0) {
      console.log('✅ Callback onExtended seria executado com sucesso');
      console.log('- setModuleHtml seria chamado com:', extendedHtml.substring(0, 100) + '...');
      console.log('- setHasUnsavedChanges(true) seria chamado');
      console.log('- Editor Tiptap seria atualizado');
      return true;
    } else {
      console.log('❌ Callback onExtended falharia - dados inválidos');
      return false;
    }
  }

  async runIntegrationTest() {
    console.log('🚀 Iniciando teste de integração AIModuleExtendDialog\n');
    
    // 1. Testar acesso à edge function
    await this.testEdgeFunctionAccess();
    
    // 2. Simular comportamento do dialog
    const extendedContent = await this.simulateDialogBehavior();
    
    // 3. Testar tratamento de erros
    await this.testErrorHandling();
    
    // 4. Testar formato da resposta
    await this.testResponseFormat();
    
    // 5. Simular callback onExtended
    if (extendedContent) {
      await this.simulateOnExtendedCallback(extendedContent);
    }
    
    // Resumo dos resultados
    console.log('\n📊 RESUMO DOS TESTES DE INTEGRAÇÃO:');
    console.log('- Acesso à edge function:', this.testResults.edgeFunction ? '✅ OK' : '❌ FALHA');
    console.log('- Simulação do dialog:', this.testResults.dialogSimulation ? '✅ OK' : '❌ FALHA');
    console.log('- Tratamento de erros:', this.testResults.errorHandling ? '✅ OK' : '❌ FALHA');
    console.log('- Formato da resposta:', this.testResults.responseFormat ? '✅ OK' : '❌ FALHA');
    
    const allTestsPassed = Object.values(this.testResults).every(result => result);
    
    console.log('\n🏁 Resultado geral:', allTestsPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM');
    
    if (!allTestsPassed) {
      console.log('\n🔍 POSSÍVEIS PROBLEMAS IDENTIFICADOS:');
      if (!this.testResults.edgeFunction) {
        console.log('- A edge function não está acessível com a chave anônima');
      }
      if (!this.testResults.dialogSimulation) {
        console.log('- O dialog não está enviando os dados corretos ou a resposta é inválida');
      }
      if (!this.testResults.errorHandling) {
        console.log('- O tratamento de erros precisa ser melhorado');
      }
      if (!this.testResults.responseFormat) {
        console.log('- O formato da resposta não está compatível com o frontend');
      }
    }
    
    return allTestsPassed;
  }
}

async function main() {
  const tester = new DialogIntegrationTester();
  const success = await tester.runIntegrationTest();
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);