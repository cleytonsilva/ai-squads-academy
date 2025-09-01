/**
 * Script para corrigir conteúdo duplicado dos módulos
 * Gera conteúdo específico para cada módulo 'Prova Final' baseado no curso
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Conteúdo específico para cada curso
 */
const courseSpecificContent = {
  'Curso de Cibersegurança': {
    title: 'Avaliação Final - Cibersegurança',
    content: `
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
    `
  },
  'Blue Team Fundamentos': {
    title: 'Avaliação Final - Blue Team',
    content: `
      <h2>Avaliação Final - Blue Team Fundamentos</h2>
      <p>Chegou o momento de demonstrar seus conhecimentos em Blue Team! Esta avaliação final testará sua compreensão dos conceitos fundamentais de defesa cibernética.</p>
      
      <h3>📋 Instruções da Prova</h3>
      <ul>
        <li>Avaliação abrangente sobre todos os módulos do curso</li>
        <li>Questões práticas e teóricas sobre Blue Team</li>
        <li>Tempo recomendado: 60-90 minutos</li>
        <li>Nota mínima para aprovação: 70%</li>
      </ul>
      
      <h3>🛡️ Áreas de Conhecimento Avaliadas</h3>
      <ul>
        <li><strong>Introdução ao Blue Team:</strong> Papel e responsabilidades da equipe defensiva</li>
        <li><strong>Fundamentos de Segurança:</strong> Princípios CIA, controles de segurança</li>
        <li><strong>Análise de Risco:</strong> Identificação, avaliação e mitigação de riscos</li>
        <li><strong>Monitoramento e Resposta:</strong> SOC, SIEM e procedimentos de resposta</li>
        <li><strong>Ferramentas de Segurança:</strong> IDS/IPS, antivírus, análise forense</li>
        <li><strong>Políticas de Segurança:</strong> Desenvolvimento e implementação</li>
        <li><strong>Treinamento e Conscientização:</strong> Educação em segurança</li>
      </ul>
      
      <h3>🎖️ Competências Blue Team</h3>
      <p>Esta avaliação verificará sua capacidade de:</p>
      <ul>
        <li>Identificar e analisar ameaças de segurança</li>
        <li>Implementar controles defensivos eficazes</li>
        <li>Responder adequadamente a incidentes de segurança</li>
        <li>Utilizar ferramentas de monitoramento e análise</li>
        <li>Desenvolver estratégias de defesa em profundidade</li>
      </ul>
      
      <h3>🏆 Certificação</h3>
      <p>Ao ser aprovado, você receberá:</p>
      <ul>
        <li>Certificado Blue Team Fundamentos</li>
        <li>Badge de Analista de Segurança</li>
        <li>Recomendações para próximos passos na carreira</li>
      </ul>
      
      <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>🎯 Estratégia:</strong> Pense como um defensor! Considere sempre a perspectiva de proteção e monitoramento ao responder as questões.</p>
      </div>
    `
  }
};

/**
 * Função principal para corrigir conteúdo duplicado
 */
async function fixDuplicateContent() {
  console.log('🔧 Iniciando correção de conteúdo duplicado...');
  
  try {
    // Buscar os módulos com conteúdo duplicado
    const { data: duplicateModules, error } = await supabase
      .from('modules')
      .select(`
        id,
        title,
        content_jsonb,
        course_id,
        courses!inner(
          id,
          title
        )
      `)
      .eq('title', 'Prova Final')
      .in('id', [
        '4061b636-3e2e-418b-81be-10b5b3b1c8ba', // Curso de Cibersegurança
        'a313a0d4-d1e6-4617-bef8-cf1b2aa4d702'  // Blue Team Fundamentos
      ]);
    
    if (error) {
      throw new Error(`Erro ao buscar módulos duplicados: ${error.message}`);
    }
    
    console.log(`📖 Encontrados ${duplicateModules.length} módulos para correção`);
    
    // Corrigir cada módulo
    for (const module of duplicateModules) {
      const courseTitle = module.courses.title;
      const specificContent = courseSpecificContent[courseTitle];
      
      if (!specificContent) {
        console.warn(`⚠️  Conteúdo específico não encontrado para o curso: ${courseTitle}`);
        continue;
      }
      
      console.log(`\n🔄 Atualizando módulo: ${courseTitle} > ${module.title}`);
      console.log(`   ID: ${module.id}`);
      
      // Criar backup do conteúdo original
      const backupData = {
        moduleId: module.id,
        originalTitle: module.title,
        originalContent: module.content_jsonb,
        courseTitle: courseTitle,
        timestamp: new Date().toISOString()
      };
      
      // Salvar backup
      const backupPath = `./scripts/backup-module-${module.id}.json`;
      const fs = await import('fs');
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
      console.log(`   💾 Backup salvo: ${backupPath}`);
      
      // Atualizar conteúdo do módulo
      const newContent = {
        html: specificContent.content.trim(),
        summary: `Avaliação final do curso ${courseTitle}`,
        lastUpdated: new Date().toISOString(),
        migrationNote: 'Conteúdo atualizado para corrigir duplicação - migração TinyMCE para Tiptap'
      };
      
      const { error: updateError } = await supabase
        .from('modules')
        .update({
          title: specificContent.title,
          content_jsonb: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', module.id);
      
      if (updateError) {
        console.error(`❌ Erro ao atualizar módulo ${module.id}:`, updateError.message);
        continue;
      }
      
      console.log(`   ✅ Módulo atualizado com sucesso`);
      console.log(`   📝 Novo título: ${specificContent.title}`);
      console.log(`   📄 Conteúdo: ${newContent.html.length} caracteres`);
    }
    
    console.log('\n🎉 Correção de conteúdo duplicado concluída!');
    
    // Verificar se a correção foi bem-sucedida
    await verifyFix();
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    process.exit(1);
  }
}

/**
 * Verifica se a correção foi aplicada corretamente
 */
async function verifyFix() {
  console.log('\n🔍 Verificando se a correção foi aplicada...');
  
  try {
    const { data: modules, error } = await supabase
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
    
    if (error) {
      throw new Error(`Erro na verificação: ${error.message}`);
    }
    
    console.log('\n📊 RESULTADO DA VERIFICAÇÃO:');
    modules.forEach(module => {
      const contentLength = module.content_jsonb?.html?.length || 0;
      console.log(`\n   📖 ${module.courses.title}:`);
      console.log(`      Título: ${module.title}`);
      console.log(`      Conteúdo: ${contentLength} caracteres`);
      console.log(`      Status: ${contentLength > 100 ? '✅ Corrigido' : '⚠️  Ainda genérico'}`);
    });
    
    // Verificar se ainda há duplicação
    const contents = modules.map(m => JSON.stringify(m.content_jsonb));
    const hasDuplication = contents.length !== new Set(contents).size;
    
    console.log(`\n🔄 Duplicação: ${hasDuplication ? '❌ Ainda existe' : '✅ Corrigida'}`);
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar correção
fixDuplicateContent().catch(console.error);