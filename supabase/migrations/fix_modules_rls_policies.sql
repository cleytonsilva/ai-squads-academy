-- Corrigir políticas RLS da tabela modules para permitir updates de usuários autenticados

-- 1. Primeiro, remover políticas existentes que podem estar bloqueando
DROP POLICY IF EXISTS "modules_select_policy" ON modules;
DROP POLICY IF EXISTS "modules_insert_policy" ON modules;
DROP POLICY IF EXISTS "modules_update_policy" ON modules;
DROP POLICY IF EXISTS "modules_delete_policy" ON modules;

-- 2. Criar políticas mais permissivas para usuários autenticados

-- Política para SELECT: usuários autenticados podem ler todos os módulos
CREATE POLICY "modules_select_policy" ON modules
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Política para INSERT: usuários autenticados podem criar módulos
CREATE POLICY "modules_insert_policy" ON modules
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política para UPDATE: usuários autenticados podem atualizar módulos
CREATE POLICY "modules_update_policy" ON modules
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política para DELETE: usuários autenticados podem deletar módulos
CREATE POLICY "modules_delete_policy" ON modules
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- 3. Garantir que as permissões básicas estão concedidas
GRANT ALL PRIVILEGES ON modules TO authenticated;
GRANT SELECT ON modules TO anon;

-- 4. Verificar se RLS está habilitado (deve estar)
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- 5. Comentários para documentação
COMMENT ON POLICY "modules_select_policy" ON modules IS 'Permite leitura de módulos para usuários autenticados';
COMMENT ON POLICY "modules_insert_policy" ON modules IS 'Permite criação de módulos para usuários autenticados';
COMMENT ON POLICY "modules_update_policy" ON modules IS 'Permite atualização de módulos para usuários autenticados';
COMMENT ON POLICY "modules_delete_policy" ON modules IS 'Permite exclusão de módulos para usuários autenticados';