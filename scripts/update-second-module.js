/**
 * Script para atualizar o segundo módulo duplicado
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configuração do Supabase com service role
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function updateSecondModule() {
  console.log('🔧 Atualizando segundo módulo (Curso de Cibersegurança)...');
  
  try {
    const moduleId = '4061b636-3e2e-418b-81be-10b5b3b1c8ba';
    
    const newContent = {
      html: `
        <h2>Avaliação Final - Cibersegurança</h2>
        <p>Parabéns por chegar até aqui! Esta é sua avaliação final do curso de Cibersegurança.</p>
        
        <h3>📋 Instruções da Prova</h3>
        <ul>
          <li>Esta avaliação contém questões sobre todos os módulos estudados</li>
          <li>Você terá tempo suficiente para responder com calma</li>
          <li>Leia cada questão com atenção antes de responder</li>
          <li>É necessário obter pelo menos 70% de acertos para aprovação</li>
        </ul>
        
        <h3>🎯 Temas Abordados</h3>
        <ul>
          <li><strong>Introdução à Cibersegurança:</strong> Conceitos fundamentais e importância</li>
          <li><strong>Tipos de Ameaças:</strong> Malware, phishing, ataques DDoS e outros</li>
          <li><strong>Práticas de Proteção:</strong> Senhas seguras, autenticação e criptografia</li>
          <li><strong>Segurança em Redes:</strong> Firewalls, VPNs e monitoramento</li>
          <li><strong>Legislação e Compliance:</strong> LGPD, GDPR e normas de segurança</li>
          <li><strong>Resposta a Incidentes:</strong> Detecção, contenção e recuperação</li>
          <li><strong>Futuro da Cibersegurança:</strong> Tendências e tecnologias emergentes</li>
        </ul>
        
        <h3>✅ Após a Conclusão</h3>
        <p>Ao finalizar esta avaliação com sucesso, você receberá:</p>
        <ul>
          <li>Certificado de conclusão do curso</li>
          <li>Badge de especialista em Cibersegurança</li>
          <li>Acesso a materiais complementares</li>
        </ul>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>💡 Dica:</strong> Revise os conceitos principais de cada módulo antes de iniciar a prova. Boa sorte!</p>
        </div>
      `,
      summary: 'Avaliação final do curso de Cibersegurança',
      lastUpdated: new Date().toISOString(),
      migrationNote: 'Conteúdo corrigido - migração TinyMCE para Tiptap'
    };
    
    const { data, error } = await supabase
      .from('modules')
      .update({
        title: 'Avaliação Final - Cibersegurança',
        content_jsonb: newContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select();
    
    if (error) {
      console.error('❌ Erro na atualização:', error.message);
      return;
    }
    
    console.log('✅ Segundo módulo atualizado com sucesso!');
    console.log(`📝 Título: ${data[0].title}`);
    console.log(`📄 Conteúdo: ${data[0].content_jsonb.html.length} caracteres`);
    
    // Verificar se agora não há mais duplicação
    console.log('\n🔍 Verificando se a duplicação foi resolvida...');
    
    const { data: bothModules, error: verifyError } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        content_jsonb,
        courses!inner(
          title
        )
      `)
      .in('id', [
        '4061b636-3e2e-418b-81be-10b5b3b1c8ba',
        'a313a0d4-d1e6-4617-bef8-cf1b2aa4d702'
      ]);
    
    if (verifyError) {
      console.error('❌ Erro na verificação:', verifyError.message);
      return;
    }
    
    console.log('\n📊 ESTADO FINAL DOS MÓDULOS:');
    bothModules.forEach(module => {
      console.log(`\n   📖 ${module.courses.title}:`);
      console.log(`      Título: ${module.title}`);
      console.log(`      Conteúdo: ${module.content_jsonb.html.length} caracteres`);
      console.log(`      Última atualização: ${module.content_jsonb.lastUpdated}`);
    });
    
    // Verificar duplicação
    const contents = bothModules.map(m => JSON.stringify(m.content_jsonb));
    const hasDuplication = contents.length !== new Set(contents).size;
    
    console.log(`\n🔄 Status da duplicação: ${hasDuplication ? '❌ Ainda existe' : '✅ Resolvida'}`);
    
    if (!hasDuplication) {
      console.log('\n🎉 SUCESSO! Problema de conteúdo duplicado foi corrigido!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar atualização
updateSecondModule().catch(console.error);