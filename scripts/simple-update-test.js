/**
 * Script simples para testar atualização de módulos
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

// Tentar com service role key se disponível
const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function testUpdate() {
  console.log('🔧 Testando atualização de módulos...');
  console.log(`Usando chave: ${serviceRoleKey ? 'SERVICE_ROLE' : 'ANON'}`);
  
  try {
    // Primeiro, verificar permissões
    const { data: testData, error: testError } = await supabase
      .from('modules')
      .select('id, title')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro ao ler módulos:', testError.message);
      return;
    }
    
    console.log('✅ Leitura funcionando');
    
    // Testar atualização em um módulo específico
    const moduleId = 'a313a0d4-d1e6-4617-bef8-cf1b2aa4d702';
    
    console.log(`\n🔄 Tentando atualizar módulo ${moduleId}...`);
    
    const newContent = {
      html: `
        <h2>Avaliação Final - Blue Team Fundamentos</h2>
        <p>Esta é sua avaliação final do curso Blue Team Fundamentos.</p>
        
        <h3>📋 Instruções</h3>
        <ul>
          <li>Leia cada questão com atenção</li>
          <li>Você precisa de 70% de acertos para aprovação</li>
          <li>O tempo é suficiente para uma análise cuidadosa</li>
        </ul>
        
        <h3>🛡️ Temas Abordados</h3>
        <ul>
          <li>Introdução ao Blue Team</li>
          <li>Fundamentos de Segurança da Informação</li>
          <li>Análise de Risco</li>
          <li>Monitoramento e Resposta a Incidentes</li>
          <li>Ferramentas de Segurança</li>
          <li>Políticas de Segurança</li>
          <li>Treinamento e Conscientização</li>
        </ul>
        
        <p><strong>Boa sorte em sua avaliação!</strong></p>
      `,
      summary: 'Avaliação final do curso Blue Team Fundamentos',
      lastUpdated: new Date().toISOString(),
      migrationNote: 'Conteúdo corrigido - migração TinyMCE para Tiptap'
    };
    
    const { data, error } = await supabase
      .from('modules')
      .update({
        title: 'Avaliação Final - Blue Team',
        content_jsonb: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select();
    
    if (error) {
      console.error('❌ Erro na atualização:', error.message);
      console.error('Detalhes:', error);
      return;
    }
    
    console.log('✅ Atualização bem-sucedida!');
    console.log('Dados retornados:', JSON.stringify(data, null, 2));
    
    // Verificar se a atualização foi persistida
    console.log('\n🔍 Verificando persistência...');
    
    const { data: verifyData, error: verifyError } = await supabase
      .from('modules')
      .select('id, title, content_jsonb')
      .eq('id', moduleId)
      .single();
    
    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError.message);
      return;
    }
    
    console.log('📊 Estado atual do módulo:');
    console.log(`   Título: ${verifyData.title}`);
    console.log(`   Conteúdo HTML: ${verifyData.content_jsonb?.html?.length || 0} caracteres`);
    console.log(`   Última atualização: ${verifyData.content_jsonb?.lastUpdated || 'N/A'}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testUpdate().catch(console.error);