import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente com service key para operações de teste
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class SaveTimingTester {
  constructor() {
    this.testModuleId = null;
    this.courseId = 'fddbc02b-e27c-45fb-a35c-b6fed692db7a'; // Course ID válido
  }

  async createTestModule() {
    console.log('📝 Criando módulo de teste...');
    
    const { data, error } = await supabase
      .from('modules')
      .insert({
        course_id: this.courseId,
        title: 'Teste de Timing - ' + Date.now(),
        content_jsonb: {
          html: '<p>Conteúdo inicial para teste de timing.</p>',
          last_saved: new Date().toISOString(),
          version: 1
        },
        order_index: 999
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar módulo:', error);
      return false;
    }
    
    this.testModuleId = data.id;
    console.log('✅ Módulo criado:', this.testModuleId);
    return true;
  }

  async simulateExtensionAndSave() {
    console.log('\n🔄 Simulando extensão de conteúdo e salvamento...');
    
    const originalContent = '<p>Conteúdo inicial para teste de timing.</p>';
    
    // 1. Simular extensão de conteúdo
    console.log('🤖 Iniciando extensão com IA...');
    const extensionStart = Date.now();
    
    const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-extend-module', {
      body: {
        html: originalContent,
        moduleTitle: 'Teste de Timing',
        prompt: 'Adicionar mais informações sobre timing',
        length: 'medium',
        tone: 'technical'
      }
    });
    
    const extensionDuration = Date.now() - extensionStart;
    
    if (aiError || !aiData?.extendedHtml) {
      console.error('❌ Erro na extensão:', aiError);
      return false;
    }
    
    console.log(`✅ Extensão concluída em ${extensionDuration}ms`);
    console.log(`📏 Conteúdo expandido: ${originalContent.length} → ${aiData.extendedHtml.length} chars`);
    
    // 2. Simular diferentes cenários de timing de salvamento
    const scenarios = [
      { name: 'Salvamento Imediato', delay: 0 },
      { name: 'Salvamento com 100ms delay', delay: 100 },
      { name: 'Salvamento com 500ms delay', delay: 500 },
      { name: 'Salvamento com 1s delay', delay: 1000 },
      { name: 'Salvamento com 2s delay', delay: 2000 }
    ];
    
    const results = [];
    
    for (const scenario of scenarios) {
      console.log(`\n📋 Testando: ${scenario.name}`);
      
      // Simular delay antes do salvamento
      if (scenario.delay > 0) {
        console.log(`⏱️ Aguardando ${scenario.delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, scenario.delay));
      }
      
      // Simular salvamento
      const saveStart = Date.now();
      
      const { data: saveData, error: saveError } = await supabase
        .from('modules')
        .update({
          content_jsonb: {
            html: aiData.extendedHtml,
            last_saved: new Date().toISOString(),
            version: 2
          }
        })
        .eq('id', this.testModuleId)
        .select()
        .single();
      
      const saveDuration = Date.now() - saveStart;
      
      if (saveError) {
        console.error(`❌ Erro no salvamento (${scenario.name}):`, saveError);
        results.push({ scenario: scenario.name, success: false, error: saveError.message });
        continue;
      }
      
      // Verificar se o conteúdo foi salvo corretamente
      const savedHtml = saveData.content_jsonb?.html;
      const contentMatches = savedHtml === aiData.extendedHtml;
      
      console.log(`✅ Salvamento concluído em ${saveDuration}ms`);
      console.log(`📊 Conteúdo preservado: ${contentMatches ? 'SIM' : 'NÃO'}`);
      
      if (!contentMatches) {
        console.log(`⚠️ Conteúdo esperado: ${aiData.extendedHtml.length} chars`);
        console.log(`⚠️ Conteúdo salvo: ${savedHtml?.length || 0} chars`);
      }
      
      results.push({
        scenario: scenario.name,
        success: contentMatches,
        extensionDuration,
        saveDuration,
        totalTime: extensionDuration + scenario.delay + saveDuration,
        contentLength: savedHtml?.length || 0
      });
      
      // Pequeno delay entre cenários
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  async testConcurrentOperations() {
    console.log('\n🔀 Testando operações concorrentes...');
    
    const originalContent = '<p>Teste de concorrência.</p>';
    
    // Simular múltiplas extensões simultâneas
    const promises = [];
    
    for (let i = 0; i < 3; i++) {
      const promise = supabase.functions.invoke('ai-extend-module', {
        body: {
          html: originalContent,
          moduleTitle: `Teste Concorrente ${i + 1}`,
          prompt: `Expandir conteúdo versão ${i + 1}`,
          length: 'short',
          tone: 'casual'
        }
      });
      
      promises.push(promise);
    }
    
    console.log('🚀 Executando 3 extensões simultâneas...');
    const startTime = Date.now();
    
    try {
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      console.log(`✅ Todas as extensões concluídas em ${duration}ms`);
      
      // Verificar se todas foram bem-sucedidas
      const successful = results.filter(r => !r.error && r.data?.extendedHtml);
      console.log(`📊 Sucessos: ${successful.length}/3`);
      
      // Simular salvamentos sequenciais dos resultados
      for (let i = 0; i < successful.length; i++) {
        const result = successful[i];
        
        const { error } = await supabase
          .from('modules')
          .update({
            content_jsonb: {
              html: result.data.extendedHtml,
              last_saved: new Date().toISOString(),
              version: 3 + i
            }
          })
          .eq('id', this.testModuleId);
        
        if (error) {
          console.error(`❌ Erro no salvamento ${i + 1}:`, error);
        } else {
          console.log(`✅ Salvamento ${i + 1} concluído`);
        }
        
        // Delay entre salvamentos
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return successful.length === 3;
      
    } catch (error) {
      console.error('❌ Erro nas operações concorrentes:', error);
      return false;
    }
  }

  async testRaceConditions() {
    console.log('\n🏁 Testando race conditions específicas...');
    
    const originalContent = '<p>Teste de race condition.</p>';
    
    // Cenário 1: Extensão + Salvamento simultâneos
    console.log('📋 Cenário 1: Extensão e salvamento simultâneos');
    
    const extensionPromise = supabase.functions.invoke('ai-extend-module', {
      body: {
        html: originalContent,
        moduleTitle: 'Race Test',
        prompt: 'Expandir para teste de race condition',
        length: 'medium',
        tone: 'technical'
      }
    });
    
    // Simular salvamento manual simultâneo
    const manualSavePromise = supabase
      .from('modules')
      .update({
        content_jsonb: {
          html: originalContent + '<p>Salvamento manual simultâneo.</p>',
          last_saved: new Date().toISOString(),
          version: 10
        }
      })
      .eq('id', this.testModuleId);
    
    try {
      const [extensionResult, saveResult] = await Promise.all([
        extensionPromise,
        manualSavePromise
      ]);
      
      console.log('✅ Operações simultâneas concluídas');
      console.log('- Extensão:', extensionResult.error ? 'ERRO' : 'SUCESSO');
      console.log('- Salvamento:', saveResult.error ? 'ERRO' : 'SUCESSO');
      
      // Verificar estado final
      const { data: finalState } = await supabase
        .from('modules')
        .select('content_jsonb')
        .eq('id', this.testModuleId)
        .single();
      
      console.log('📊 Estado final:', {
        version: finalState?.content_jsonb?.version,
        contentLength: finalState?.content_jsonb?.html?.length || 0
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro no teste de race condition:', error);
      return false;
    }
  }

  async cleanup() {
    if (this.testModuleId) {
      console.log('\n🧹 Limpando dados de teste...');
      
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', this.testModuleId);
      
      if (error) {
        console.error('❌ Erro na limpeza:', error);
      } else {
        console.log('✅ Dados de teste removidos');
      }
    }
  }

  async runTimingAnalysis() {
    console.log('🚀 Iniciando análise de timing de salvamento\n');
    
    try {
      // 1. Criar módulo de teste
      const moduleCreated = await this.createTestModule();
      if (!moduleCreated) return false;
      
      // 2. Testar diferentes cenários de timing
      const timingResults = await this.simulateExtensionAndSave();
      
      // 3. Testar operações concorrentes
      const concurrentSuccess = await this.testConcurrentOperations();
      
      // 4. Testar race conditions
      const raceConditionSuccess = await this.testRaceConditions();
      
      // 5. Análise dos resultados
      console.log('\n📊 ANÁLISE DE TIMING - RESULTADOS:');
      
      if (timingResults) {
        console.log('\n🕐 Cenários de Timing:');
        timingResults.forEach(result => {
          const status = result.success ? '✅' : '❌';
          console.log(`${status} ${result.scenario}: ${result.totalTime}ms total (${result.contentLength} chars)`);
        });
        
        const failedScenarios = timingResults.filter(r => !r.success);
        if (failedScenarios.length > 0) {
          console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:');
          failedScenarios.forEach(scenario => {
            console.log(`- ${scenario.scenario}: Conteúdo não foi preservado corretamente`);
          });
        }
      }
      
      console.log('\n🔀 Operações Concorrentes:', concurrentSuccess ? '✅ SUCESSO' : '❌ FALHA');
      console.log('🏁 Race Conditions:', raceConditionSuccess ? '✅ TRATADAS' : '❌ PROBLEMAS');
      
      // Recomendações
      console.log('\n💡 RECOMENDAÇÕES:');
      
      if (timingResults && timingResults.some(r => !r.success)) {
        console.log('- Implementar debounce mais robusto no salvamento');
        console.log('- Adicionar retry logic para salvamentos falhados');
        console.log('- Considerar usar optimistic updates');
      }
      
      if (!concurrentSuccess) {
        console.log('- Implementar queue para operações de IA');
        console.log('- Adicionar locks para prevenir operações simultâneas');
      }
      
      if (!raceConditionSuccess) {
        console.log('- Implementar versionamento mais robusto');
        console.log('- Adicionar conflict resolution');
      }
      
      const overallSuccess = (
        timingResults && timingResults.every(r => r.success) &&
        concurrentSuccess &&
        raceConditionSuccess
      );
      
      console.log('\n🏁 Resultado geral:', overallSuccess ? '✅ TIMING OK' : '❌ PROBLEMAS DE TIMING DETECTADOS');
      
      return overallSuccess;
      
    } finally {
      await this.cleanup();
    }
  }
}

async function main() {
  const tester = new SaveTimingTester();
  const success = await tester.runTimingAnalysis();
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);