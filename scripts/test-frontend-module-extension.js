/**
 * Script de Teste Frontend - Extensão de Módulo
 * 
 * Este script testa especificamente o comportamento do frontend
 * simulando as interações do usuário no AdminCourseEditor.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Simular o estado do componente AdminCourseEditor
 */
class MockAdminCourseEditor {
  constructor() {
    this.moduleHtml = '';
    this.moduleTitle = '';
    this.selectedModuleId = null;
  }

  /**
   * Simular a função getHtml do AdminCourseEditor
   */
  getHtml(payload) {
    try {
      if (payload && typeof payload === 'object' && payload !== null && 'html' in payload) {
        return payload.html || '';
      }
      return typeof payload === 'string' ? payload : '';
    } catch {
      return '';
    }
  }

  /**
   * Simular handleSelectModule
   */
  handleSelectModule(module) {
    console.log(`📋 Selecionando módulo: ${module.title}`);
    this.selectedModuleId = module.id;
    this.moduleTitle = module.title;
    this.moduleHtml = this.getHtml(module.content_jsonb);
    
    console.log(`🔍 Estado após seleção:`);
    console.log(`   - moduleHtml: ${this.moduleHtml}`);
    console.log(`   - moduleTitle: ${this.moduleTitle}`);
    console.log(`   - selectedModuleId: ${this.selectedModuleId}`);
  }

  /**
   * Simular o callback onExtended do AIModuleExtendDialog
   */
  onExtended(extendedHtml) {
    console.log(`🤖 Extensão com IA recebida: ${extendedHtml}`);
    
    // Esta é a linha crítica que pode estar causando o problema
    const previousHtml = this.moduleHtml;
    this.moduleHtml = `${previousHtml}\n${extendedHtml}`;
    
    console.log(`🔍 Estado após extensão:`);
    console.log(`   - HTML anterior: ${previousHtml}`);
    console.log(`   - HTML estendido: ${extendedHtml}`);
    console.log(`   - HTML combinado: ${this.moduleHtml}`);
    
    return this.moduleHtml;
  }

  /**
   * Simular handleSaveModule
   */
  async handleSaveModule() {
    if (!this.selectedModuleId) {
      console.error('❌ Nenhum módulo selecionado');
      return false;
    }

    console.log(`💾 Salvando módulo...`);
    console.log(`   - ID: ${this.selectedModuleId}`);
    console.log(`   - Título: ${this.moduleTitle}`);
    console.log(`   - HTML: ${this.moduleHtml}`);

    try {
      const { error } = await supabase
        .from('modules')
        .update({ 
          title: this.moduleTitle, 
          content_jsonb: { html: this.moduleHtml } 
        })
        .eq('id', this.selectedModuleId);

      if (error) throw error;

      console.log('✅ Módulo salvo com sucesso');
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar módulo: ${error.message}`);
      return false;
    }
  }

  /**
   * Simular refetch após salvamento
   */
  async refetch() {
    console.log('🔄 Simulando refetch dos dados...');
    
    try {
      const { data: module, error } = await supabase
        .from('modules')
        .select('id, title, content_jsonb')
        .eq('id', this.selectedModuleId)
        .single();

      if (error) throw error;

      // Simular o que acontece no useEffect quando os dados são atualizados
      this.handleSelectModule(module);
      
      return module;
    } catch (error) {
      console.error(`❌ Erro no refetch: ${error.message}`);
      return null;
    }
  }
}

/**
 * Teste principal
 */
async function testFrontendFlow() {
  console.log('🚀 Iniciando teste do fluxo frontend\n');

  try {
    // 1. Buscar um módulo existente
    console.log('1️⃣ Buscando módulo para teste...');
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .limit(1);

    if (error) throw error;
    if (!modules || modules.length === 0) {
      throw new Error('Nenhum módulo encontrado');
    }

    const testModule = modules[0];
    console.log(`✅ Módulo encontrado: ${testModule.title}\n`);

    // 2. Criar instância do mock editor
    const editor = new MockAdminCourseEditor();

    // 3. Simular seleção do módulo
    console.log('2️⃣ Simulando seleção do módulo...');
    editor.handleSelectModule(testModule);
    console.log('');

    // 4. Simular extensão com IA
    console.log('3️⃣ Simulando extensão com IA...');
    const extendedContent = '<p>Conteúdo adicional gerado pela IA para teste.</p>';
    const combinedHtml = editor.onExtended(extendedContent);
    console.log('');

    // 5. Simular salvamento
    console.log('4️⃣ Simulando salvamento...');
    const saveSuccess = await editor.handleSaveModule();
    
    if (!saveSuccess) {
      console.error('❌ Falha no salvamento. Abortando teste.');
      return;
    }
    console.log('');

    // 6. Simular refetch (como acontece após salvamento)
    console.log('5️⃣ Simulando refetch após salvamento...');
    const refetchedModule = await editor.refetch();
    
    if (!refetchedModule) {
      console.error('❌ Falha no refetch. Abortando teste.');
      return;
    }
    console.log('');

    // 7. Verificar se o conteúdo foi preservado
    console.log('6️⃣ Verificando preservação do conteúdo...');
    const finalHtml = editor.moduleHtml;
    
    console.log(`🔍 Análise final:`);
    console.log(`   - HTML combinado original: ${combinedHtml}`);
    console.log(`   - HTML após refetch: ${finalHtml}`);
    
    const contentPreserved = finalHtml.includes(extendedContent.replace(/<[^>]*>/g, '').trim());
    
    if (contentPreserved) {
      console.log('✅ Conteúdo estendido foi preservado corretamente!');
    } else {
      console.log('❌ Conteúdo estendido foi perdido!');
      
      // Análise detalhada
      console.log('\n🔍 ANÁLISE DETALHADA:');
      console.log('- Verificar se o problema está na concatenação do estado');
      console.log('- Verificar se o problema está no salvamento no banco');
      console.log('- Verificar se o problema está na recuperação dos dados');
      console.log('- Verificar se há problemas de timing/race conditions');
    }

    // 8. Restaurar conteúdo original
    console.log('\n7️⃣ Restaurando conteúdo original...');
    await supabase
      .from('modules')
      .update({ content_jsonb: testModule.content_jsonb })
      .eq('id', testModule.id);
    
    console.log('✅ Conteúdo original restaurado');

  } catch (error) {
    console.error(`❌ Erro no teste: ${error.message}`);
    console.error(error);
  }

  console.log('\n🏁 Teste concluído');
}

// Executar teste
testFrontendFlow();