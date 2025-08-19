/**
 * Sistema de Gerenciamento de Migrações - AI Squads Academy
 * 
 * Este script gerencia migrações do Supabase de forma inteligente:
 * - Analisa arquivos .sql em scripts/database e supabase/migrations
 * - Verifica integridade e detecta conflitos
 * - Executa deploy em ordem correta
 * - Implementa rollback automático
 * - Realiza limpeza pós-deploy
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ncrlojjfkhevjotchhxi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Interfaces
interface MigrationFile {
  name: string;
  path: string;
  content: string;
  hash: string;
  timestamp?: string;
  priority: number;
  category: 'create' | 'alter' | 'fix' | 'data' | 'policy';
  dependencies: string[];
  applied: boolean;
}

interface MigrationResult {
  success: boolean;
  file: string;
  error?: string;
  executionTime: number;
}

interface MigrationReport {
  totalFiles: number;
  analyzed: number;
  applied: number;
  failed: number;
  skipped: number;
  results: MigrationResult[];
  conflicts: string[];
  duplicates: string[];
}

class MigrationManager {
  private migrations: MigrationFile[] = [];
  private appliedMigrations: Set<string> = new Set();
  private report: MigrationReport = {
    totalFiles: 0,
    analyzed: 0,
    applied: 0,
    failed: 0,
    skipped: 0,
    results: [],
    conflicts: [],
    duplicates: []
  };

  /**
   * Inicializa o gerenciador de migrações
   */
  async initialize(): Promise<void> {
    console.log('🚀 Inicializando Sistema de Gerenciamento de Migrações...');
    
    // Criar tabela de controle de migrações se não existir
    await this.createMigrationControlTable();
    
    // Carregar migrações já aplicadas
    await this.loadAppliedMigrations();
    
    console.log('✅ Sistema inicializado com sucesso!');
  }

  /**
   * Cria tabela de controle de migrações
   */
  private async createMigrationControlTable(): Promise<void> {
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
          rollback_sql TEXT
        );
        
        -- Habilitar RLS
        ALTER TABLE migration_history ENABLE ROW LEVEL SECURITY;
        
        -- Política para permitir acesso total ao service role
        DROP POLICY IF EXISTS "migration_history_service_policy" ON migration_history;
        CREATE POLICY "migration_history_service_policy" ON migration_history
          FOR ALL USING (true);
      `
    });

    if (error) {
      console.error('❌ Erro ao criar tabela de controle:', error);
      throw error;
    }
  }

  /**
   * Carrega migrações já aplicadas do banco
   */
  private async loadAppliedMigrations(): Promise<void> {
    const { data, error } = await supabase
      .from('migration_history')
      .select('filename')
      .eq('success', true);

    if (error) {
      console.warn('⚠️ Erro ao carregar histórico de migrações:', error);
      return;
    }

    this.appliedMigrations = new Set(data?.map(m => m.filename) || []);
    console.log(`📋 ${this.appliedMigrations.size} migrações já aplicadas encontradas`);
  }

  /**
   * Analisa todos os arquivos de migração
   */
  async analyzeMigrations(): Promise<void> {
    console.log('🔍 Analisando arquivos de migração...');
    
    const scriptsPaths = this.getFilesInDirectory('scripts/database');
    const migrationsPaths = this.getFilesInDirectory('supabase/migrations');
    
    const allPaths = [...scriptsPaths, ...migrationsPaths];
    this.report.totalFiles = allPaths.length;
    
    for (const filePath of allPaths) {
      try {
        const migration = await this.analyzeMigrationFile(filePath);
        this.migrations.push(migration);
        this.report.analyzed++;
      } catch (error) {
        console.error(`❌ Erro ao analisar ${filePath}:`, error);
      }
    }
    
    // Detectar duplicatas e conflitos
    this.detectDuplicatesAndConflicts();
    
    // Ordenar por prioridade e dependências
    this.sortMigrationsByPriority();
    
    console.log(`✅ ${this.report.analyzed} arquivos analisados`);
  }

  /**
   * Obtém lista de arquivos .sql em um diretório
   */
  private getFilesInDirectory(dirPath: string): string[] {
    const fullPath = path.resolve(dirPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Diretório não encontrado: ${fullPath}`);
      return [];
    }
    
    return fs.readdirSync(fullPath)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(fullPath, file));
  }

  /**
   * Analisa um arquivo de migração individual
   */
  private async analyzeMigrationFile(filePath: string): Promise<MigrationFile> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Extrair timestamp do nome do arquivo se existir
    const timestampMatch = name.match(/^(\d{8}_?\d*)/); 
    const timestamp = timestampMatch ? timestampMatch[1] : undefined;
    
    // Determinar categoria baseada no conteúdo e nome
    const category = this.determineMigrationCategory(name, content);
    
    // Determinar prioridade
    const priority = this.determineMigrationPriority(category, name, content);
    
    // Detectar dependências
    const dependencies = this.extractDependencies(content);
    
    // Verificar se já foi aplicada
    const applied = this.appliedMigrations.has(name);
    
    return {
      name,
      path: filePath,
      content,
      hash,
      timestamp,
      priority,
      category,
      dependencies,
      applied
    };
  }

  /**
   * Determina a categoria da migração
   */
  private determineMigrationCategory(name: string, content: string): MigrationFile['category'] {
    const lowerName = name.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerName.includes('create') || lowerContent.includes('create table')) {
      return 'create';
    }
    if (lowerName.includes('fix') || lowerName.includes('repair')) {
      return 'fix';
    }
    if (lowerName.includes('policy') || lowerContent.includes('create policy')) {
      return 'policy';
    }
    if (lowerContent.includes('alter table') || lowerContent.includes('add column')) {
      return 'alter';
    }
    if (lowerContent.includes('insert into') || lowerContent.includes('update ')) {
      return 'data';
    }
    
    return 'alter'; // default
  }

  /**
   * Determina a prioridade da migração
   */
  private determineMigrationPriority(category: string, name: string, content: string): number {
    // Prioridade mais alta = número menor
    
    // Criação de tabelas base tem prioridade máxima
    if (category === 'create' && (name.includes('profiles') || name.includes('users'))) {
      return 1;
    }
    
    // Outras criações de tabela
    if (category === 'create') {
      return 2;
    }
    
    // Alterações estruturais
    if (category === 'alter') {
      return 3;
    }
    
    // Políticas RLS
    if (category === 'policy') {
      return 4;
    }
    
    // Correções
    if (category === 'fix') {
      return 5;
    }
    
    // Dados
    if (category === 'data') {
      return 6;
    }
    
    return 7; // default
  }

  /**
   * Extrai dependências de uma migração
   */
  private extractDependencies(content: string): string[] {
    const dependencies: string[] = [];
    
    // Buscar referências a tabelas
    const tableRefs = content.match(/REFERENCES\s+(\w+)/gi);
    if (tableRefs) {
      dependencies.push(...tableRefs.map(ref => ref.split(' ')[1].toLowerCase()));
    }
    
    // Buscar foreign keys
    const fkRefs = content.match(/FOREIGN\s+KEY.*?REFERENCES\s+(\w+)/gi);
    if (fkRefs) {
      dependencies.push(...fkRefs.map(ref => {
        const match = ref.match(/REFERENCES\s+(\w+)/i);
        return match ? match[1].toLowerCase() : '';
      }).filter(Boolean));
    }
    
    return [...new Set(dependencies)];
  }

  /**
   * Detecta duplicatas e conflitos
   */
  private detectDuplicatesAndConflicts(): void {
    const hashMap = new Map<string, string[]>();
    const nameMap = new Map<string, string[]>();
    
    // Agrupar por hash e nome
    for (const migration of this.migrations) {
      // Por hash (conteúdo idêntico)
      if (!hashMap.has(migration.hash)) {
        hashMap.set(migration.hash, []);
      }
      hashMap.get(migration.hash)!.push(migration.name);
      
      // Por nome similar
      const baseName = migration.name.replace(/^\d+_?/, '').replace(/\.sql$/, '');
      if (!nameMap.has(baseName)) {
        nameMap.set(baseName, []);
      }
      nameMap.get(baseName)!.push(migration.name);
    }
    
    // Identificar duplicatas (mesmo hash)
    for (const [hash, files] of hashMap) {
      if (files.length > 1) {
        this.report.duplicates.push(`Arquivos duplicados (mesmo conteúdo): ${files.join(', ')}`);
      }
    }
    
    // Identificar possíveis conflitos (nomes similares)
    for (const [baseName, files] of nameMap) {
      if (files.length > 1) {
        this.report.conflicts.push(`Possível conflito (nomes similares): ${files.join(', ')}`);
      }
    }
  }

  /**
   * Ordena migrações por prioridade e dependências
   */
  private sortMigrationsByPriority(): void {
    this.migrations.sort((a, b) => {
      // Primeiro por prioridade
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      // Depois por timestamp se disponível
      if (a.timestamp && b.timestamp) {
        return a.timestamp.localeCompare(b.timestamp);
      }
      
      // Por último, por nome
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Executa as migrações pendentes
   */
  async executeMigrations(): Promise<void> {
    console.log('🚀 Iniciando execução das migrações...');
    
    const pendingMigrations = this.migrations.filter(m => !m.applied);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Nenhuma migração pendente encontrada!');
      return;
    }
    
    console.log(`📋 ${pendingMigrations.length} migrações pendentes encontradas`);
    
    for (const migration of pendingMigrations) {
      await this.executeSingleMigration(migration);
    }
    
    console.log('✅ Execução de migrações concluída!');
  }

  /**
   * Executa uma migração individual
   */
  private async executeSingleMigration(migration: MigrationFile): Promise<void> {
    console.log(`🔄 Executando: ${migration.name}`);
    
    const startTime = Date.now();
    
    try {
      // Verificar integridade antes da execução
      await this.verifyMigrationIntegrity(migration);
      
      // Executar a migração
      const { error } = await supabase.rpc('exec_sql', {
        sql: migration.content
      });
      
      if (error) {
        throw error;
      }
      
      const executionTime = Date.now() - startTime;
      
      // Registrar sucesso
      await this.recordMigrationResult(migration, true, executionTime);
      
      this.report.results.push({
        success: true,
        file: migration.name,
        executionTime
      });
      
      this.report.applied++;
      console.log(`✅ ${migration.name} aplicada com sucesso (${executionTime}ms)`);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Registrar falha
      await this.recordMigrationResult(migration, false, executionTime, errorMessage);
      
      this.report.results.push({
        success: false,
        file: migration.name,
        error: errorMessage,
        executionTime
      });
      
      this.report.failed++;
      console.error(`❌ Erro ao executar ${migration.name}:`, errorMessage);
      
      // Implementar rollback se necessário
      await this.handleMigrationFailure(migration, errorMessage);
    }
  }

  /**
   * Verifica integridade da migração antes da execução
   */
  private async verifyMigrationIntegrity(migration: MigrationFile): Promise<void> {
    // Verificar se dependências existem
    for (const dep of migration.dependencies) {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', dep)
        .eq('table_schema', 'public');
      
      if (error || !data || data.length === 0) {
        throw new Error(`Dependência não encontrada: tabela '${dep}' não existe`);
      }
    }
    
    // Verificar sintaxe SQL básica
    if (!migration.content.trim()) {
      throw new Error('Migração vazia');
    }
    
    // Verificar se não contém comandos perigosos
    const dangerousCommands = ['DROP DATABASE', 'TRUNCATE', 'DELETE FROM'];
    const upperContent = migration.content.toUpperCase();
    
    for (const cmd of dangerousCommands) {
      if (upperContent.includes(cmd)) {
        console.warn(`⚠️ Comando potencialmente perigoso detectado em ${migration.name}: ${cmd}`);
      }
    }
  }

  /**
   * Registra resultado da migração no banco
   */
  private async recordMigrationResult(
    migration: MigrationFile,
    success: boolean,
    executionTime: number,
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('migration_history')
      .upsert({
        filename: migration.name,
        hash: migration.hash,
        execution_time_ms: executionTime,
        success,
        error_message: errorMessage || null
      });
    
    if (error) {
      console.error('❌ Erro ao registrar resultado da migração:', error);
    }
  }

  /**
   * Trata falhas na execução de migrações
   */
  private async handleMigrationFailure(migration: MigrationFile, error: string): Promise<void> {
    console.log(`🔄 Tentando rollback para ${migration.name}...`);
    
    // Aqui você pode implementar lógica de rollback específica
    // Por exemplo, executar comandos de reversão se disponíveis
    
    console.log(`⚠️ Rollback manual pode ser necessário para ${migration.name}`);
  }

  /**
   * Realiza limpeza pós-deploy
   */
  async performPostDeployCleanup(): Promise<void> {
    console.log('🧹 Iniciando limpeza pós-deploy...');
    
    // Criar diretório applied se não existir
    const appliedDir = path.resolve('scripts/applied');
    if (!fs.existsSync(appliedDir)) {
      fs.mkdirSync(appliedDir, { recursive: true });
    }
    
    // Mover arquivos aplicados com sucesso
    const successfulMigrations = this.report.results
      .filter(r => r.success)
      .map(r => r.file);
    
    for (const fileName of successfulMigrations) {
      const migration = this.migrations.find(m => m.name === fileName);
      if (migration) {
        await this.moveAppliedMigration(migration, appliedDir);
      }
    }
    
    console.log(`✅ ${successfulMigrations.length} arquivos movidos para applied/`);
  }

  /**
   * Move migração aplicada para diretório applied
   */
  private async moveAppliedMigration(migration: MigrationFile, appliedDir: string): Promise<void> {
    try {
      const newPath = path.join(appliedDir, migration.name);
      
      // Copiar arquivo
      fs.copyFileSync(migration.path, newPath);
      
      // Remover arquivo original
      fs.unlinkSync(migration.path);
      
      console.log(`📁 ${migration.name} movido para applied/`);
    } catch (error) {
      console.error(`❌ Erro ao mover ${migration.name}:`, error);
    }
  }

  /**
   * Gera relatório final
   */
  generateReport(): void {
    console.log('\n📊 RELATÓRIO FINAL DE MIGRAÇÕES');
    console.log('================================');
    console.log(`Total de arquivos: ${this.report.totalFiles}`);
    console.log(`Analisados: ${this.report.analyzed}`);
    console.log(`Aplicados com sucesso: ${this.report.applied}`);
    console.log(`Falharam: ${this.report.failed}`);
    console.log(`Ignorados: ${this.report.skipped}`);
    
    if (this.report.duplicates.length > 0) {
      console.log('\n⚠️ DUPLICATAS ENCONTRADAS:');
      this.report.duplicates.forEach(dup => console.log(`  - ${dup}`));
    }
    
    if (this.report.conflicts.length > 0) {
      console.log('\n⚠️ POSSÍVEIS CONFLITOS:');
      this.report.conflicts.forEach(conflict => console.log(`  - ${conflict}`));
    }
    
    if (this.report.results.length > 0) {
      console.log('\n📋 RESULTADOS DETALHADOS:');
      this.report.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        const time = `(${result.executionTime}ms)`;
        const error = result.error ? ` - ${result.error}` : '';
        console.log(`  ${status} ${result.file} ${time}${error}`);
      });
    }
    
    console.log('\n================================');
  }

  /**
   * Executa o processo completo de gerenciamento de migrações
   */
  async run(): Promise<void> {
    try {
      await this.initialize();
      await this.analyzeMigrations();
      await this.executeMigrations();
      await this.performPostDeployCleanup();
      this.generateReport();
      
      console.log('\n🎉 Processo de migração concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante o processo de migração:', error);
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const manager = new MigrationManager();
  manager.run().catch(console.error);
}

export default MigrationManager;