import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente com service role para operações administrativas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
// Cliente com anon key para simular o comportamento do frontend
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

class ExtensionFlowTester {
  constructor() {
    this.testModuleId = null;
    this.originalContent = null;
    this.extendedContent = null;
  }

  async setupTestModule() {
    console.log('🔧 Configurando módulo de teste...');
    
    // Criar um módulo de teste
    const testModule = {
      title: 'Teste de Extensão - ' + Date.now(),
      content_jsonb: {
        html: '<p>Este é um conteúdo inicial sobre programação.</p><p>Vamos aprender sobre variáveis.</p>',
        last_saved: new Date().toISOString(),
        version: 1
      },
      course_id: 'fddbc02b-e27c-45fb-a35c-b6fed692db7a', // UUID válido de curso existente
      order_index: 999
    };
    
    const { data, error } = await supabaseAdmin
      .from('modules')
      .insert(testModule)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar módulo de teste:', error);
      throw error;
    }
    
    this.testModuleId = data.id;
    this.originalContent = testModule.content_jsonb.html;
    
    console.log('✅ Módulo de teste criado:', {
      id: this.testModuleId,
      title: data.title,
      contentLength: this.originalContent.length
    });
    
    return data;
  }

  async simulateContentExtension() {
    console.log('\n🤖 Simulando extensão de conteúdo via IA...');
    
    const extensionRequest = {
      html: this.originalContent,
      moduleTitle: 'Teste de Extensão',
      prompt: 'Adicione mais informações sobre tipos de dados e exemplos práticos',
      length: 'medium',
      tone: 'educational'
    };
    
    console.log('📤 Enviando para edge function:', {
      originalLength: this.originalContent.length,
      prompt: extensionRequest.prompt
    });
    
    const startTime = Date.now();
    
    const { data, error } = await supabaseClient.functions.invoke('ai-extend-module', {
      body: extensionRequest
    });
    
    const duration = Date.now() - startTime;
    
    if (error) {
      console.error('❌ Erro na extensão:', error);
      throw error;
    }
    
    if (!data || !data.extendedHtml) {
      console.error('❌ Conteúdo estendido não retornado');
      throw new Error('Conteúdo estendido não retornado');
    }
    
    this.extendedContent = data.extendedHtml;
    
    console.log('✅ Conteúdo estendido gerado:', {
      duration: `${duration}ms`,
      originalLength: this.originalContent.length,
      extendedLength: this.extendedContent.length,
      expansion: `${((this.extendedContent.length / this.originalContent.length - 1) * 100).toFixed(1)}%`
    });
    
    return this.extendedContent;
  }

  async simulateAdminCourseEditorSave() {
    console.log('\n💾 Simulando salvamento no AdminCourseEditor...');
    
    // Simular o comportamento do AdminCourseEditor.handleSaveModule
    const updateData = {
      content_jsonb: {
        html: this.extendedContent,
        last_saved: new Date().toISOString(),
        version: 2
      }
    };
    
    console.log('📤 Salvando conteúdo estendido no banco:', {
      moduleId: this.testModuleId,
      contentLength: this.extendedContent.length,
      version: updateData.content_jsonb.version
    });
    
    const { data, error } = await supabaseAdmin
      .from('modules')
      .update(updateData)
      .eq('id', this.testModuleId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao salvar:', error);
      throw error;
    }
    
    console.log('✅ Conteúdo salvo com sucesso:', {
      id: data.id,
      savedLength: data.content_jsonb.html.length,
      version: data.content_jsonb.version,
      lastSaved: data.content_jsonb.last_saved
    });
    
    return data;
  }

  async verifyPersistence() {
    console.log('\n🔍 Verificando persistência do conteúdo...');
    
    // Simular recarregamento da página - buscar o módulo novamente
    const { data, error } = await supabaseClient
      .from('modules')
      .select('*')
      .eq('id', this.testModuleId)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar módulo:', error);
      throw error;
    }
    
    const retrievedContent = data.content_jsonb.html;
    
    console.log('📥 Conteúdo recuperado:', {
      id: data.id,
      title: data.title,
      contentLength: retrievedContent.length,
      version: data.content_jsonb.version,
      lastSaved: data.content_jsonb.last_saved
    });
    
    // Verificar se o conteúdo estendido foi preservado
    const isContentPreserved = retrievedContent === this.extendedContent;
    
    if (isContentPreserved) {
      console.log('✅ SUCESSO: Conteúdo estendido foi preservado corretamente!');
    } else {
      console.log('❌ FALHA: Conteúdo estendido foi perdido ou modificado!');
      console.log('Diferenças encontradas:');
      console.log('- Tamanho esperado:', this.extendedContent.length);
      console.log('- Tamanho recuperado:', retrievedContent.length);
      
      // Mostrar primeiros 200 caracteres de cada um para comparação
      console.log('\n- Conteúdo esperado (início):');
      console.log(this.extendedContent.substring(0, 200) + '...');
      console.log('\n- Conteúdo recuperado (início):');
      console.log(retrievedContent.substring(0, 200) + '...');
    }
    
    return {
      preserved: isContentPreserved,
      expected: this.extendedContent,
      retrieved: retrievedContent,
      module: data
    };
  }

  async testRaceConditions() {
    console.log('\n⚡ Testando condições de corrida (race conditions)...');
    
    // Simular múltiplas operações simultâneas
    const operations = [];
    
    // Operação 1: Extensão de conteúdo
    operations.push(this.simulateContentExtension());
    
    // Operação 2: Salvamento manual (simulando usuário digitando)
    operations.push(new Promise(resolve => {
      setTimeout(async () => {
        const manualContent = this.originalContent + '<p>Conteúdo adicionado manualmente.</p>';
        const { data } = await supabaseAdmin
          .from('modules')
          .update({
            content_jsonb: {
              html: manualContent,
              last_saved: new Date().toISOString(),
              version: 3
            }
          })
          .eq('id', this.testModuleId)
          .select()
          .single();
        resolve(data);
      }, 2000);
    }));
    
    try {
      const results = await Promise.allSettled(operations);
      
      console.log('📊 Resultados das operações simultâneas:');
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ Operação ${index + 1}: Sucesso`);
        } else {
          console.log(`❌ Operação ${index + 1}: Falha -`, result.reason.message);
        }
      });
      
    } catch (error) {
      console.error('❌ Erro nas operações simultâneas:', error);
    }
  }

  async cleanup() {
    console.log('\n🧹 Limpando dados de teste...');
    
    if (this.testModuleId) {
      const { error } = await supabaseAdmin
        .from('modules')
        .delete()
        .eq('id', this.testModuleId);
      
      if (error) {
        console.error('❌ Erro ao limpar módulo de teste:', error);
      } else {
        console.log('✅ Módulo de teste removido');
      }
    }
  }

  async runCompleteTest() {
    console.log('🚀 Iniciando teste completo do fluxo de extensão\n');
    
    try {
      // 1. Configurar módulo de teste
      await this.setupTestModule();
      
      // 2. Simular extensão de conteúdo
      await this.simulateContentExtension();
      
      // 3. Simular salvamento no AdminCourseEditor
      await this.simulateAdminCourseEditorSave();
      
      // 4. Verificar persistência
      const persistenceResult = await this.verifyPersistence();
      
      // 5. Testar race conditions
      await this.testRaceConditions();
      
      console.log('\n📋 RESUMO DO TESTE:');
      console.log('- Edge function:', '✅ Funcionando');
      console.log('- Extensão de conteúdo:', '✅ Funcionando');
      console.log('- Salvamento no banco:', '✅ Funcionando');
      console.log('- Persistência:', persistenceResult.preserved ? '✅ OK' : '❌ FALHA');
      
      return persistenceResult.preserved;
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

async function main() {
  const tester = new ExtensionFlowTester();
  const success = await tester.runCompleteTest();
  
  console.log('\n🏁 Teste concluído:', success ? 'SUCESSO' : 'FALHA');
  process.exit(success ? 0 : 1);
}

main().catch(console.error);