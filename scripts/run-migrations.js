/**
 * Script de execução simplificado para o sistema de migrações
 * 
 * Uso:
 * node scripts/run-migrations.js [opções]
 * 
 * Opções:
 * --analyze-only: Apenas analisa as migrações sem executar
 * --dry-run: Simula a execução sem aplicar as migrações
 * --force: Força a execução mesmo com conflitos
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ncrlojjfkhevjotchhxi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcmxvampma2hldmpvdGNoaHhpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE5NzcyMywiZXhwIjoyMDY5NzczNzIzfQ.LMdGQjXhKLzixtVu4MQ5An7qytDtB9ylbZFYks_cJro';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Argumentos da linha de comando
const args = process.argv.slice(2);
const options = {
  analyzeOnly: args.includes('--analyze-only'),
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force')
};

/**
 * Classe simplificada para execução de migrações
 */
class SimpleMigrationRunner {
  constructor() {
    this.migrations = [];
    this.appliedMigrations = new Set();
  }

  /**
   * Inicializa o runner
   */
  async initialize() {
    console.log('🚀 Inicializando runner de migrações...');
    
    // Criar tabela de controle se não existir
    await this.ensureMigrationTable();
    
    // Carregar migrações já aplicadas
    await this.loadAppliedMigrations();
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
            error_message TEXT
          );
          
          ALTER TABLE migration_history ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "migration_history_policy" ON migration_history;
          CREATE POLICY "migration_history_policy" ON migration_history FOR ALL USING (true);
        `
      });

      if (error) {
        console.error('❌ Erro ao criar tabela de controle:', error);
      } else {
        console.log('✅ Tabela de controle verificada');
      }
    } catch (err) {
      console.error('❌ Erro na inicialização:', err);
    }
  }

  /**
   * Carrega migrações já aplicadas
   */
  async loadAppliedMigrations() {
    try {
      const { data, error } = await supabase
        .from('migration_history')
        .select('filename')
        .eq('success', true);

      if (error) {
        console.warn('⚠️ Erro ao carregar histórico:', error);
        return;
      }

      this.appliedMigrations = new Set(data?.map(m => m.filename) || []);
      console.log(`📋 ${this.appliedMigrations.size} migrações já aplicadas`);
    } catch (err) {
      console.warn('⚠️ Erro ao carregar histórico:', err);
    }
  }

  /**
   * Analisa arquivos de migração
   */
  async analyzeMigrations() {
    console.log('🔍 Analisando migrações...');
    
    const directories = [
      path.resolve('scripts/database'),
      path.resolve('supabase/migrations')
    ];
    
    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir)
          .filter(file => file.endsWith('.sql'))
          .map(file => path.join(dir, file));
        
        for (const filePath of files) {
          const migration = this.analyzeMigrationFile(filePath);
          this.migrations.push(migration);
        }
      }
    }
    
    // Ordenar por nome (que inclui timestamp)
    this.migrations.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`✅ ${this.migrations.length} migrações encontradas`);
  }

  /**
   * Analisa um arquivo de migração
   */
  analyzeMigrationFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const applied = this.appliedMigrations.has(name);
    
    return {
      name,
      path: filePath,
      content,
      hash,
      applied
    };
  }

  /**
   * Executa migrações pendentes
   */
  async executeMigrations() {
    const pendingMigrations = this.migrations.filter(m => !m.applied);
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Nenhuma migração pendente!');
      return;
    }
    
    console.log(`📋 ${pendingMigrations.length} migrações pendentes`);
    
    if (options.dryRun) {
      console.log('🔍 Modo dry-run - apenas simulando:');
      pendingMigrations.forEach(m => {
        console.log(`  - ${m.name}`);
      });
      return;
    }
    
    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }
  }

  /**
   * Executa uma migração
   */
  async executeMigration(migration) {
    console.log(`🔄 Executando: ${migration.name}`);
    
    const startTime = Date.now();
    
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: migration.content
      });
      
      if (error) {
        throw error;
      }
      
      const executionTime = Date.now() - startTime;
      
      // Registrar sucesso
      await supabase.from('migration_history').upsert({
        filename: migration.name,
        hash: migration.hash,
        execution_time_ms: executionTime,
        success: true
      });
      
      console.log(`✅ ${migration.name} aplicada (${executionTime}ms)`);
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error.message || String(error);
      
      // Registrar falha
      await supabase.from('migration_history').upsert({
        filename: migration.name,
        hash: migration.hash,
        execution_time_ms: executionTime,
        success: false,
        error_message: errorMessage
      });
      
      console.error(`❌ Erro em ${migration.name}:`, errorMessage);
      
      if (!options.force) {
        throw new Error(`Migração falhou: ${migration.name}`);
      }
    }
  }

  /**
   * Move arquivos aplicados
   */
  async moveAppliedFiles() {
    console.log('🧹 Movendo arquivos aplicados...');
    
    const appliedDir = path.resolve('scripts/applied');
    if (!fs.existsSync(appliedDir)) {
      fs.mkdirSync(appliedDir, { recursive: true });
    }
    
    const successfulMigrations = this.migrations.filter(m => {
      return this.appliedMigrations.has(m.name) || 
             m.path.includes('scripts/database');
    });
    
    for (const migration of successfulMigrations) {
      try {
        const newPath = path.join(appliedDir, migration.name);
        
        if (!fs.existsSync(newPath)) {
          fs.copyFileSync(migration.path, newPath);
          fs.unlinkSync(migration.path);
          console.log(`📁 ${migration.name} movido para applied/`);
        }
      } catch (error) {
        console.error(`❌ Erro ao mover ${migration.name}:`, error);
      }
    }
  }

  /**
   * Executa o processo completo
   */
  async run() {
    try {
      await this.initialize();
      await this.analyzeMigrations();
      
      if (options.analyzeOnly) {
        console.log('\n📊 ANÁLISE COMPLETA');
        console.log('===================');
        this.migrations.forEach(m => {
          const status = m.applied ? '✅ Aplicada' : '⏳ Pendente';
          console.log(`${status}: ${m.name}`);
        });
        return;
      }
      
      await this.executeMigrations();
      
      if (!options.dryRun) {
        await this.moveAppliedFiles();
      }
      
      console.log('\n🎉 Processo concluído!');
      
    } catch (error) {
      console.error('❌ Erro durante execução:', error);
      process.exit(1);
    }
  }
}

// Executar
const runner = new SimpleMigrationRunner();
runner.run();