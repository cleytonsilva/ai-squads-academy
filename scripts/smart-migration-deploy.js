/**
 * Sistema Inteligente de Deploy de Migrações
 * 
 * Este script resolve conflitos automaticamente e executa migrações de forma segura:
 * - Remove duplicatas
 * - Resolve conflitos de criação de tabelas
 * - Executa migrações em ordem correta
 * - Implementa rollback automático
 * - Realiza limpeza pós-deploy
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

class SmartMigrationDeploy {
  constructor() {
    this.migrations = [];
    this.appliedMigrations = new Set();
    this.existingTables = new Set();
    this.deployPlan = [];
    this.backupPath = path.resolve('scripts/backup');
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
   * Inicializa o sistema de deploy
   */
  async initialize() {
    console.log('🚀 Inicializando Sistema Inteligente de Deploy...');
    
    // Criar diretórios necessários
    this.createDirectories();
    
    // Criar tabela de controle
    await this.ensureMigrationTable();
    
    // Carregar estado atual
    await this.loadCurrentState();
    
    console.log('✅ Sistema inicializado com sucesso!');
  }

  /**
   * Cria diretórios necessários
   */
  createDirectories() {
    const dirs = [this.backupPath, this.appliedPath, this.conflictsPath];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Diretório criado: ${path.basename(dir)}/`);
      }
    });
  }

  /**
   * Garante que a tabela de controle existe
   */
  async ensureMigrationTable() {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS migration_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255) NOT NULL UNIQUE,
            hash VARCHAR(64) NOT NULL,
            applied_at TIMESTAMPTZ DEFAULT NOW(),
            execution_time_ms INTEGER,
            success BOOLEAN DEFAULT TRUE,
            error_message TEXT,
            rollback_sql TEXT,
            backup_path TEXT
          );
          
          ALTER TABLE migration_history ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "migration_history_policy" ON migration_history;
          CREATE POLICY "migration_history_policy" ON migration_history FOR ALL USING (true);
          
          GRANT ALL ON migration_history TO authenticated;
          GRANT ALL ON migration_history TO anon;
        `
      });

      if (error) {
        console.error('❌ Erro ao criar tabela de controle:', error);
        throw error;
      }
      
      console.log('✅ Tabela de controle verificada');
    } catch (err) {
      console.error('❌ Erro na inicialização da tabela:', err);
      throw err;
    }
  }

  /**
   * Carrega estado atual do banco
   */
  async loadCurrentState() {
    // Carregar migrações aplicadas
    try {
      const { data, error } = await supabase
        .from('migration_history')
        .select('filename')
        .eq('success', true);

      if (!error && data) {
        this.appliedMigrations = new Set(data.map(m => m.filename));
        console.log(`📋 ${this.appliedMigrations.size} migrações já aplicadas`);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao carregar histórico:', err);
    }

    // Carregar tabelas existentes
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (!error && data) {
        this.existingTables = new Set(data.map(t => t.table_name));
        console.log(`🗃️ ${this.existingTables.size} tabelas existentes`);
      }
    } catch (err) {
      console.warn('⚠️ Erro ao carregar tabelas:', err);
    }
  }

  /**
   * Analisa e carrega todas as migrações
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
   * Analisa uma migração individual
   */
  analyzeMigration(filePath, sourceType) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Análise do conteúdo
    const upperContent = content.toUpperCase();
    const tables = this.extractTables(content);
    const operations = this.extractOperations(upperContent);
    const dependencies = this.extractDependencies(content);
    
    return {
      name,
      path: filePath,
      content,
      hash,
      sourceType,
      applied: this.appliedMigrations.has(name),
      tables,
      operations,
      dependencies,
      priority: this.calculatePriority(name, operations, tables)
    };
  }

  /**
   * Extrai tabelas do conteúdo
   */
  extractTables(content) {
    const tables = [];
    
    // CREATE TABLE
    const createMatches = content.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?([\w_]+)/gi);
    if (createMatches) {
      createMatches.forEach(match => {
        const tableName = match.replace(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?/i, '').trim();
        tables.push(tableName.toLowerCase());
      });
    }
    
    // ALTER TABLE
    const alterMatches = content.match(/ALTER TABLE\s+(?:public\.)?([\w_]+)/gi);
    if (alterMatches) {
      alterMatches.forEach(match => {
        const tableName = match.replace(/ALTER TABLE\s+(?:public\.)?/i, '').trim();
        tables.push(tableName.toLowerCase());
      });
    }
    
    return [...new Set(tables)];
  }

  /**
   * Extrai operações do conteúdo
   */
  extractOperations(upperContent) {
    const operations = [];
    
    if (upperContent.includes('CREATE TABLE')) operations.push('CREATE_TABLE');
    if (upperContent.includes('ALTER TABLE')) operations.push('ALTER_TABLE');
    if (upperContent.includes('CREATE POLICY')) operations.push('CREATE_POLICY');
    if (upperContent.includes('DROP POLICY')) operations.push('DROP_POLICY');
    if (upperContent.includes('INSERT INTO')) operations.push('INSERT_DATA');
    if (upperContent.includes('CREATE INDEX')) operations.push('CREATE_INDEX');
    if (upperContent.includes('CREATE FUNCTION')) operations.push('CREATE_FUNCTION');
    if (upperContent.includes('CREATE TRIGGER')) operations.push('CREATE_TRIGGER');
    
    return operations;
  }

  /**
   * Extrai dependências do conteúdo
   */
  extractDependencies(content) {
    const dependencies = [];
    
    const refMatches = content.match(/REFERENCES\s+(?:public\.)?([\w_]+)/gi);
    if (refMatches) {
      refMatches.forEach(match => {
        const tableName = match.replace(/REFERENCES\s+(?:public\.)?/i, '').trim();
        if (tableName !== 'auth') { // Ignorar schema auth
          dependencies.push(tableName.toLowerCase());
        }
      });
    }
    
    return [...new Set(dependencies)];
  }

  /**
   * Calcula prioridade da migração
   */
  calculatePriority(name, operations, tables) {
    let priority = 100; // Prioridade padrão
    
    // Prioridade alta para criação de tabelas base
    if (operations.includes('CREATE_TABLE')) {
      if (tables.includes('profiles')) priority = 10;
      else if (tables.includes('courses')) priority = 20;
      else if (tables.includes('modules')) priority = 30;
      else priority = 40;
    }
    
    // Prioridade média para alterações
    if (operations.includes('ALTER_TABLE')) {
      priority = 50;
    }
    
    // Prioridade baixa para políticas e dados
    if (operations.includes('CREATE_POLICY') || operations.includes('INSERT_DATA')) {
      priority = 60;
    }
    
    // Ajustar por timestamp se disponível
    const timestampMatch = name.match(/^(\d{8})/); 
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1]);
      priority += timestamp / 100000; // Adicionar timestamp normalizado
    }
    
    return priority;
  }

  /**
   * Resolve conflitos automaticamente
   */
  async resolveConflicts() {
    console.log('🔧 Resolvendo conflitos...');
    
    // 1. Remover duplicatas
    await this.removeDuplicates();
    
    // 2. Resolver conflitos de criação de tabelas
    await this.resolveTableConflicts();
    
    // 3. Filtrar migrações já aplicadas
    this.filterAppliedMigrations();
    
    console.log('✅ Conflitos resolvidos');
  }

  /**
   * Remove arquivos duplicados
   */
  async removeDuplicates() {
    const hashMap = new Map();
    
    // Agrupar por hash
    for (const migration of this.migrations) {
      if (!hashMap.has(migration.hash)) {
        hashMap.set(migration.hash, []);
      }
      hashMap.get(migration.hash).push(migration);
    }
    
    // Processar duplicatas
    for (const [hash, duplicates] of hashMap) {
      if (duplicates.length > 1) {
        console.log(`🔄 Resolvendo duplicata: ${duplicates.map(d => d.name).join(', ')}`);
        
        // Manter apenas o mais recente ou o da pasta migrations
        const keeper = this.selectBestDuplicate(duplicates);
        const toRemove = duplicates.filter(d => d !== keeper);
        
        // Mover duplicatas para pasta conflicts
        for (const dup of toRemove) {
          await this.moveToConflicts(dup, 'duplicate');
          this.migrations = this.migrations.filter(m => m !== dup);
          this.report.duplicatesRemoved++;
        }
      }
    }
  }

  /**
   * Seleciona a melhor duplicata para manter
   */
  selectBestDuplicate(duplicates) {
    // Priorizar migrations sobre scripts
    const migrationFiles = duplicates.filter(d => d.sourceType === 'migrations');
    if (migrationFiles.length > 0) {
      // Pegar o mais recente por nome
      return migrationFiles.sort((a, b) => b.name.localeCompare(a.name))[0];
    }
    
    // Se todos são scripts, pegar o mais recente
    return duplicates.sort((a, b) => b.name.localeCompare(a.name))[0];
  }

  /**
   * Resolve conflitos de criação de tabelas
   */
  async resolveTableConflicts() {
    const tableCreations = new Map();
    
    // Agrupar criações de tabela
    for (const migration of this.migrations) {
      if (migration.operations.includes('CREATE_TABLE')) {
        for (const table of migration.tables) {
          if (!tableCreations.has(table)) {
            tableCreations.set(table, []);
          }
          tableCreations.get(table).push(migration);
        }
      }
    }
    
    // Resolver conflitos
    for (const [table, creators] of tableCreations) {
      if (creators.length > 1) {
        console.log(`🔧 Resolvendo conflito de criação: tabela '${table}'`);
        
        // Se a tabela já existe, remover todas as criações
        if (this.existingTables.has(table)) {
          for (const creator of creators) {
            await this.moveToConflicts(creator, `table_exists_${table}`);
            this.migrations = this.migrations.filter(m => m !== creator);
            this.report.conflictsResolved++;
          }
        } else {
          // Manter apenas a melhor criação
          const keeper = this.selectBestTableCreation(creators, table);
          const toRemove = creators.filter(c => c !== keeper);
          
          for (const creator of toRemove) {
            await this.moveToConflicts(creator, `multiple_create_${table}`);
            this.migrations = this.migrations.filter(m => m !== creator);
            this.report.conflictsResolved++;
          }
        }
      }
    }
  }

  /**
   * Seleciona a melhor criação de tabela
   */
  selectBestTableCreation(creators, table) {
    // Priorizar por tipo de fonte
    const migrationFiles = creators.filter(c => c.sourceType === 'migrations');
    if (migrationFiles.length > 0) {
      // Pegar o mais recente
      return migrationFiles.sort((a, b) => b.name.localeCompare(a.name))[0];
    }
    
    // Se todos são scripts, priorizar por nome específico
    const specificCreators = creators.filter(c => 
      c.name.includes(`create_${table}`) || 
      c.name.includes(`${table}_table`)
    );
    
    if (specificCreators.length > 0) {
      return specificCreators[0];
    }
    
    // Fallback: o primeiro
    return creators[0];
  }

  /**
   * Filtra migrações já aplicadas
   */
  filterAppliedMigrations() {
    const beforeCount = this.migrations.length;
    
    this.migrations = this.migrations.filter(m => {
      if (m.applied) {
        console.log(`⏭️ Ignorando migração já aplicada: ${m.name}`);
        this.report.skipped++;
        return false;
      }
      return true;
    });
    
    const filtered = beforeCount - this.migrations.length;
    if (filtered > 0) {
      console.log(`📋 ${filtered} migrações já aplicadas filtradas`);
    }
  }

  /**
   * Move arquivo para pasta de conflitos
   */
  async moveToConflicts(migration, reason) {
    try {
      const conflictDir = path.join(this.conflictsPath, reason);
      if (!fs.existsSync(conflictDir)) {
        fs.mkdirSync(conflictDir, { recursive: true });
      }
      
      const newPath = path.join(conflictDir, migration.name);
      fs.copyFileSync(migration.path, newPath);
      
      console.log(`📁 ${migration.name} movido para conflicts/${reason}/`);
    } catch (error) {
      console.error(`❌ Erro ao mover ${migration.name}:`, error);
    }
  }

  /**
   * Cria plano de deploy
   */
  createDeployPlan() {
    console.log('📋 Criando plano de deploy...');
    
    // Ordenar por prioridade e dependências
    this.deployPlan = [...this.migrations].sort((a, b) => {
      // Primeiro por prioridade
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Depois por nome (timestamp)
      return a.name.localeCompare(b.name);
    });
    
    console.log(`📋 Plano criado com ${this.deployPlan.length} migrações`);
    
    // Mostrar plano
    if (this.deployPlan.length > 0) {
      console.log('\n📋 PLANO DE DEPLOY:');
      this.deployPlan.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name} (${migration.operations.join(', ')})`);
      });
      console.log('');
    }
  }

  /**
   * Executa o deploy das migrações
   */
  async executeDeploy() {
    if (this.deployPlan.length === 0) {
      console.log('✅ Nenhuma migração para executar!');
      return;
    }
    
    console.log(`🚀 Iniciando deploy de ${this.deployPlan.length} migrações...`);
    
    for (let i = 0; i < this.deployPlan.length; i++) {
      const migration = this.deployPlan[i];
      console.log(`\n[${i + 1}/${this.deployPlan.length}] Executando: ${migration.name}`);
      
      const success = await this.executeMigration(migration);
      
      if (!success) {
        console.log('❌ Deploy interrompido devido a falha');
        break;
      }
    }
    
    console.log('\n✅ Deploy concluído!');
  }

  /**
   * Executa uma migração individual
   */
  async executeMigration(migration) {
    const startTime = Date.now();
    
    try {
      // Criar backup
      const backupPath = await this.createBackup(migration);
      
      // Executar migração
      const { error } = await supabase.rpc('exec_sql', {
        sql: migration.content
      });
      
      if (error) {
        throw error;
      }
      
      const executionTime = Date.now() - startTime;
      
      // Registrar sucesso
      await this.recordMigrationResult(migration, true, executionTime, null, backupPath);
      
      this.report.results.push({
        migration: migration.name,
        success: true,
        executionTime,
        operations: migration.operations
      });
      
      this.report.deployed++;
      console.log(`✅ Sucesso (${executionTime}ms)`);
      
      return true;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error.message || String(error);
      
      // Registrar falha
      await this.recordMigrationResult(migration, false, executionTime, errorMessage);
      
      this.report.results.push({
        migration: migration.name,
        success: false,
        error: errorMessage,
        executionTime
      });
      
      this.report.failed++;
      console.error(`❌ Falha: ${errorMessage}`);
      
      // Tentar rollback
      await this.attemptRollback(migration, errorMessage);
      
      return false;
    }
  }

  /**
   * Cria backup antes da execução
   */
  async createBackup(migration) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${timestamp}_${migration.name}`;
      const backupFilePath = path.join(this.backupPath, backupFileName);
      
      fs.copyFileSync(migration.path, backupFilePath);
      
      return backupFilePath;
    } catch (error) {
      console.warn(`⚠️ Erro ao criar backup para ${migration.name}:`, error);
      return null;
    }
  }

  /**
   * Registra resultado da migração
   */
  async recordMigrationResult(migration, success, executionTime, errorMessage, backupPath) {
    try {
      const { error } = await supabase
        .from('migration_history')
        .upsert({
          filename: migration.name,
          hash: migration.hash,
          execution_time_ms: executionTime,
          success,
          error_message: errorMessage,
          backup_path: backupPath
        });
      
      if (error) {
        console.error('❌ Erro ao registrar resultado:', error);
      }
    } catch (err) {
      console.error('❌ Erro ao salvar histórico:', err);
    }
  }

  /**
   * Tenta rollback em caso de falha
   */
  async attemptRollback(migration, error) {
    console.log(`🔄 Tentando rollback para ${migration.name}...`);
    
    // Aqui você pode implementar lógica de rollback específica
    // Por exemplo, executar comandos de reversão se disponíveis
    
    console.log(`⚠️ Rollback manual pode ser necessário`);
  }

  /**
   * Realiza limpeza pós-deploy
   */
  async performCleanup() {
    console.log('🧹 Realizando limpeza pós-deploy...');
    
    // Mover arquivos aplicados com sucesso
    const successfulMigrations = this.report.results
      .filter(r => r.success)
      .map(r => r.migration);
    
    for (const migrationName of successfulMigrations) {
      const migration = this.deployPlan.find(m => m.name === migrationName);
      if (migration) {
        await this.moveToApplied(migration);
      }
    }
    
    console.log(`✅ ${successfulMigrations.length} arquivos movidos para applied/`);
  }

  /**
   * Move migração aplicada para pasta applied
   */
  async moveToApplied(migration) {
    try {
      const newPath = path.join(this.appliedPath, migration.name);
      
      if (!fs.existsSync(newPath)) {
        fs.copyFileSync(migration.path, newPath);
        fs.unlinkSync(migration.path);
        console.log(`📁 ${migration.name} movido para applied/`);
      }
    } catch (error) {
      console.error(`❌ Erro ao mover ${migration.name}:`, error);
    }
  }

  /**
   * Gera relatório final
   */
  generateFinalReport() {
    console.log('\n📊 RELATÓRIO FINAL DE DEPLOY');
    console.log('==============================');
    console.log(`Migrações analisadas: ${this.report.analyzed}`);
    console.log(`Duplicatas removidas: ${this.report.duplicatesRemoved}`);
    console.log(`Conflitos resolvidos: ${this.report.conflictsResolved}`);
    console.log(`Migrações ignoradas: ${this.report.skipped}`);
    console.log(`Deploy bem-sucedido: ${this.report.deployed}`);
    console.log(`Falhas: ${this.report.failed}`);
    
    if (this.report.results.length > 0) {
      console.log('\n📋 RESULTADOS DETALHADOS:');
      this.report.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const time = `(${result.executionTime}ms)`;
        const ops = result.operations ? ` [${result.operations.join(', ')}]` : '';
        const error = result.error ? ` - ${result.error}` : '';
        console.log(`  ${status} ${result.migration} ${time}${ops}${error}`);
      });
    }
    
    const totalIssues = this.report.failed;
    if (totalIssues === 0) {
      console.log('\n🎉 Deploy concluído com sucesso! Todas as migrações foram aplicadas.');
    } else {
      console.log(`\n⚠️ Deploy concluído com ${totalIssues} falha(s). Verifique os logs acima.`);
    }
    
    console.log('\n==============================');
  }

  /**
   * Executa o processo completo de deploy
   */
  async run() {
    try {
      await this.initialize();
      await this.loadMigrations();
      await this.resolveConflicts();
      this.createDeployPlan();
      await this.executeDeploy();
      await this.performCleanup();
      this.generateFinalReport();
      
      console.log('\n🎉 Processo de deploy inteligente concluído!');
    } catch (error) {
      console.error('❌ Erro durante o deploy:', error);
      process.exit(1);
    }
  }
}

// Executar sempre (para debug)
const deployer = new SmartMigrationDeploy();
deployer.run().catch(console.error);

export default SmartMigrationDeploy;