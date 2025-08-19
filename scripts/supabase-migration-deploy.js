/**
 * Sistema de Deploy de Migrações usando Supabase MCP
 * 
 * Este script usa as ferramentas do Supabase MCP para aplicar migrações de forma segura
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ncrlojjfkhevjotchhxi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class SupabaseMigrationDeploy {
  constructor() {
    this.migrations = [];
    this.appliedPath = path.resolve('scripts/applied');
    this.conflictsPath = path.resolve('scripts/conflicts');
    this.report = {
      analyzed: 0,
      duplicatesRemoved: 0,
      conflictsResolved: 0,
      deployed: 0,
      failed: 0,
      skipped: 0,
      results: []
    };
  }

  /**
   * Inicializa o sistema
   */
  async initialize() {
    console.log('🚀 Inicializando Deploy via Supabase MCP...');
    
    // Criar diretórios necessários
    this.createDirectories();
    
    console.log('✅ Sistema inicializado!');
  }

  /**
   * Cria diretórios necessários
   */
  createDirectories() {
    const dirs = [this.appliedPath, this.conflictsPath];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório criado: ${path.basename(dir)}/`);
      }
    });
  }

  /**
   * Carrega e analisa migrações
   */
  async loadMigrations() {
    console.log('🔍 Carregando migrações...');
    
    const directories = [
      { path: 'scripts/database', type: 'scripts' },
      { path: 'supabase/migrations', type: 'migrations' }
    ];
    
    for (const dir of directories) {
      const fullPath = path.resolve(dir.path);
      
      if (fs.existsSync(fullPath)) {
        const files = fs.readdirSync(fullPath)
          .filter(file => file.endsWith('.sql'))
          .map(file => path.join(fullPath, file));
        
        for (const filePath of files) {
          const migration = this.analyzeMigration(filePath, dir.type);
          this.migrations.push(migration);
          this.report.analyzed++;
        }
      }
    }
    
    console.log(`✅ ${this.migrations.length} migrações carregadas`);
  }

  /**
   * Analisa uma migração
   */
  analyzeMigration(filePath, sourceType) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Análise básica do conteúdo
    const upperContent = content.toUpperCase();
    const operations = [];
    
    if (upperContent.includes('CREATE TABLE')) operations.push('CREATE_TABLE');
    if (upperContent.includes('ALTER TABLE')) operations.push('ALTER_TABLE');
    if (upperContent.includes('CREATE POLICY')) operations.push('CREATE_POLICY');
    if (upperContent.includes('INSERT INTO')) operations.push('INSERT_DATA');
    
    // Calcular prioridade simples
    let priority = 100;
    if (operations.includes('CREATE_TABLE')) {
      if (name.includes('profiles')) priority = 10;
      else if (name.includes('courses')) priority = 20;
      else priority = 30;
    } else if (operations.includes('ALTER_TABLE')) {
      priority = 50;
    } else if (operations.includes('CREATE_POLICY')) {
      priority = 60;
    }
    
    return {
      name,
      path: filePath,
      content,
      hash,
      sourceType,
      operations,
      priority
    };
  }

  /**
   * Resolve conflitos básicos
   */
  resolveBasicConflicts() {
    console.log('🔧 Resolvendo conflitos básicos...');
    
    // Remover duplicatas por hash
    const hashMap = new Map();
    const toKeep = [];
    
    for (const migration of this.migrations) {
      if (!hashMap.has(migration.hash)) {
        hashMap.set(migration.hash, migration);
        toKeep.push(migration);
      } else {
        console.log(`🔄 Removendo duplicata: ${migration.name}`);
        this.moveToConflicts(migration, 'duplicate');
        this.report.duplicatesRemoved++;
      }
    }
    
    this.migrations = toKeep;
    
    // Filtrar migrações problemáticas conhecidas
    const problematicPatterns = [
      'restore_complete_database.sql', // Muito complexo
      'execute_restore_database.sql', // Muito complexo
      'debug_admin_auth.sql', // Debug apenas
      'reset_admin_password.sql' // Operação específica
    ];
    
    this.migrations = this.migrations.filter(migration => {
      const isProblematic = problematicPatterns.some(pattern => 
        migration.name.includes(pattern)
      );
      
      if (isProblematic) {
        console.log(`⏭️ Ignorando migração problemática: ${migration.name}`);
        this.moveToConflicts(migration, 'problematic');
        this.report.skipped++;
        return false;
      }
      
      return true;
    });
    
    console.log(`✅ ${this.migrations.length} migrações após resolução de conflitos`);
  }

  /**
   * Move arquivo para conflitos
   */
  moveToConflicts(migration, reason) {
    try {
      const conflictDir = path.join(this.conflictsPath, reason);
      if (!fs.existsSync(conflictDir)) {
        fs.mkdirSync(conflictDir, { recursive: true });
      }
      
      const newPath = path.join(conflictDir, migration.name);
      if (!fs.existsSync(newPath)) {
        fs.copyFileSync(migration.path, newPath);
      }
    } catch (error) {
      console.error(`❌ Erro ao mover ${migration.name}:`, error);
    }
  }

  /**
   * Cria plano de deploy ordenado
   */
  createDeployPlan() {
    console.log('📋 Criando plano de deploy...');
    
    // Ordenar por prioridade e nome
    this.migrations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });
    
    console.log(`📋 Plano criado com ${this.migrations.length} migrações`);
    
    if (this.migrations.length > 0) {
      console.log('\n📋 PLANO DE DEPLOY:');
      this.migrations.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name} (${migration.operations.join(', ')})`);
      });
      console.log('');
    }
  }

  /**
   * Prepara migrações para o Supabase
   */
  async prepareMigrationsForSupabase() {
    console.log('📝 Preparando migrações para Supabase...');
    
    // Criar diretório de migrações temporário
    const tempMigrationsDir = path.resolve('supabase/migrations/temp');
    if (!fs.existsSync(tempMigrationsDir)) {
      fs.mkdirSync(tempMigrationsDir, { recursive: true });
    }
    
    // Copiar migrações selecionadas com nomes padronizados
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    
    for (let i = 0; i < this.migrations.length; i++) {
      const migration = this.migrations[i];
      const paddedIndex = String(i + 1).padStart(3, '0');
      const newName = `${timestamp}${paddedIndex}_${migration.name}`;
      const newPath = path.join(tempMigrationsDir, newName);
      
      // Limpar conteúdo da migração
      let cleanContent = this.cleanMigrationContent(migration.content);
      
      fs.writeFileSync(newPath, cleanContent);
      
      // Atualizar referência
      migration.tempPath = newPath;
      migration.tempName = newName;
    }
    
    console.log(`✅ ${this.migrations.length} migrações preparadas`);
  }

  /**
   * Limpa conteúdo da migração
   */
  cleanMigrationContent(content) {
    // Remover comentários de debug
    let cleaned = content.replace(/-- Debug.*$/gm, '');
    
    // Remover comandos problemáticos
    cleaned = cleaned.replace(/DROP DATABASE.*$/gm, '');
    cleaned = cleaned.replace(/TRUNCATE.*$/gm, '');
    
    // Garantir que CREATE TABLE use IF NOT EXISTS
    cleaned = cleaned.replace(
      /CREATE TABLE\s+(?!IF NOT EXISTS)([\w_\.]+)/gi,
      'CREATE TABLE IF NOT EXISTS $1'
    );
    
    // Garantir que políticas sejam recriadas
    cleaned = cleaned.replace(
      /CREATE POLICY\s+(["']?[\w_]+["']?)\s+ON/gi,
      'DROP POLICY IF EXISTS $1 ON public.profiles;\nCREATE POLICY $1 ON'
    );
    
    return cleaned;
  }

  /**
   * Executa deploy usando arquivos preparados
   */
  async executeDeploy() {
    if (this.migrations.length === 0) {
      console.log('✅ Nenhuma migração para executar!');
      return;
    }
    
    console.log(`🚀 Iniciando deploy de ${this.migrations.length} migrações...`);
    console.log('\n⚠️ IMPORTANTE: Use o Supabase MCP para aplicar as migrações preparadas');
    console.log('📁 Migrações preparadas em: supabase/migrations/temp/');
    
    // Listar arquivos preparados
    console.log('\n📋 ARQUIVOS PREPARADOS:');
    this.migrations.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.tempName}`);
    });
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Use o Supabase MCP para aplicar cada migração individualmente');
    console.log('2. Monitore os logs para verificar sucesso');
    console.log('3. Execute o script de limpeza após sucesso');
    
    // Simular aplicação para relatório
    for (const migration of this.migrations) {
      this.report.results.push({
        migration: migration.name,
        tempFile: migration.tempName,
        operations: migration.operations,
        status: 'prepared'
      });
    }
  }

  /**
   * Realiza limpeza pós-deploy
   */
  async performCleanup() {
    console.log('🧹 Preparando limpeza pós-deploy...');
    
    // Mover arquivos originais para applied
    for (const migration of this.migrations) {
      try {
        const newPath = path.join(this.appliedPath, migration.name);
        
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(migration.path, newPath);
          console.log(`📁 ${migration.name} copiado para applied/`);
        }
      } catch (error) {
        console.error(`❌ Erro ao mover ${migration.name}:`, error);
      }
    }
    
    console.log('\n⚠️ LIMPEZA MANUAL NECESSÁRIA:');
    console.log('1. Após confirmar sucesso das migrações via Supabase MCP:');
    console.log('2. Remova os arquivos originais das pastas scripts/database e supabase/migrations');
    console.log('3. Mantenha apenas os arquivos em applied/');
    console.log('4. Remova o diretório supabase/migrations/temp/');
  }

  /**
   * Gera relatório final
   */
  generateFinalReport() {
    console.log('\n📊 RELATÓRIO DE PREPARAÇÃO');
    console.log('============================');
    console.log(`Migrações analisadas: ${this.report.analyzed}`);
    console.log(`Duplicatas removidas: ${this.report.duplicatesRemoved}`);
    console.log(`Migrações ignoradas: ${this.report.skipped}`);
    console.log(`Migrações preparadas: ${this.migrations.length}`);
    
    if (this.report.results.length > 0) {
      console.log('\n📋 MIGRAÇÕES PREPARADAS:');
      this.report.results.forEach((result, index) => {
        const ops = result.operations.join(', ');
        console.log(`  ${index + 1}. ${result.migration} [${ops}]`);
        console.log(`     → ${result.tempFile}`);
      });
    }
    
    console.log('\n🎯 PRÓXIMAS AÇÕES:');
    console.log('1. Use o Supabase MCP para aplicar as migrações em supabase/migrations/temp/');
    console.log('2. Monitore cada aplicação para garantir sucesso');
    console.log('3. Execute limpeza manual após confirmação');
    
    console.log('\n============================');
  }

  /**
   * Executa o processo completo
   */
  async run() {
    try {
      await this.initialize();
      await this.loadMigrations();
      this.resolveBasicConflicts();
      this.createDeployPlan();
      await this.prepareMigrationsForSupabase();
      await this.executeDeploy();
      await this.performCleanup();
      this.generateFinalReport();
      
      console.log('\n🎉 Preparação concluída! Use o Supabase MCP para aplicar as migrações.');
    } catch (error) {
      console.error('❌ Erro durante preparação:', error);
      process.exit(1);
    }
  }
}

// Executar
const deployer = new SupabaseMigrationDeploy();
deployer.run().catch(console.error);

export default SupabaseMigrationDeploy;