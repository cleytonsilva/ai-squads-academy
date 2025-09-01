# Análise do Diagnóstico: Problema de RLS no Upload Manual de Capas

## 📋 Resumo Executivo

O diagnóstico identificou **múltiplos problemas** que explicam o erro `StorageApiError: new row violates row-level security policy` no upload manual de capas:

### 🔍 Principais Descobertas

1. **❌ Usuário não autenticado no script**: O script não conseguiu acessar a sessão do usuário
2. **❌ Bucket course-images não encontrado**: O bucket não existe ou não está acessível
3. **❌ Upload falha mesmo com service_role**: Problema de configuração do bucket
4. **✅ Tabela profiles funcionando**: Acesso à tabela profiles está correto (2 registros)

---

## 🔍 Análise Detalhada dos Problemas

### 1. Problema de Autenticação

**Erro**: `Auth session missing!`

**Causa**: O script Node.js não tem acesso à sessão do usuário do browser.

**Impacto**: Este não é o problema real, pois o erro ocorre no frontend onde o usuário está logado.

### 2. Bucket course-images Não Encontrado

**Erro**: `Bucket course-images não encontrado`

**Causa Provável**: 
- O bucket não foi criado corretamente
- Problema de permissões para listar buckets
- Configuração incorreta do Supabase

**Impacto**: **CRÍTICO** - Este é provavelmente o problema principal!

### 3. Upload Falha com Service Role

**Erro**: `mime type text/plain is not supported`

**Causa**: O bucket tem restrições de tipo MIME que não permitem `text/plain`.

**Impacto**: Confirma que o problema não é apenas de RLS, mas de configuração do bucket.

---

## 🎯 Causa Raiz Identificada

### Problema Principal: **Bucket course-images não existe ou está mal configurado**

O erro `StorageApiError: new row violates row-level security policy` pode ser **enganoso**. Na verdade, o problema parece ser:

1. **Bucket inexistente**: O bucket `course-images` não foi criado corretamente
2. **Configuração incorreta**: Se existe, não está configurado adequadamente
3. **Políticas RLS secundárias**: As políticas RLS são um problema secundário

---

## 🔧 Soluções Recomendadas

### Solução 1: Verificar e Criar o Bucket (PRIORITÁRIA)

```sql
-- 1. Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE id = 'course-images';

-- 2. Se não existir, criar o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

### Solução 2: Aplicar Migração Existente

```bash
# Executar a migração que cria o bucket
supabase db push

# Ou aplicar especificamente a migração do bucket
# Verificar arquivo: supabase/migrations/20250202_setup_course_covers_storage.sql
```

### Solução 3: Configurar Políticas RLS Corretas

Após criar o bucket, aplicar as políticas:

```sql
-- Política para leitura pública
CREATE POLICY "Public read access for course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Política para upload por admins/instrutores
CREATE POLICY "Admins and instructors can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'instructor')
  )
);
```

### Solução 4: Verificar Configuração do Usuário

1. **Verificar se o usuário tem role admin/instructor**:
   ```sql
   SELECT u.email, p.role 
   FROM auth.users u
   JOIN profiles p ON p.user_id = u.id
   WHERE u.email = 'email_do_usuario@exemplo.com';
   ```

2. **Se necessário, atualizar role**:
   ```sql
   UPDATE profiles 
   SET role = 'admin' 
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'email_do_usuario@exemplo.com');
   ```

---

## 🚀 Plano de Ação Imediato

### Passo 1: Verificar Bucket no Dashboard Supabase
1. Acessar Dashboard do Supabase
2. Ir para Storage
3. Verificar se bucket `course-images` existe
4. Se não existir, criar manualmente

### Passo 2: Aplicar Migração
```bash
cd ai-squads-academy
supabase db push
```

### Passo 3: Testar Upload
1. Fazer login como admin/instructor
2. Tentar upload manual de capa
3. Verificar se erro persiste

### Passo 4: Se Problema Persistir
1. Verificar logs do Supabase
2. Verificar role do usuário
3. Verificar políticas RLS específicas

---

## 📊 Próximos Passos

1. **Imediato**: Criar/verificar bucket course-images
2. **Curto prazo**: Aplicar todas as migrações pendentes
3. **Médio prazo**: Implementar testes automatizados para storage
4. **Longo prazo**: Melhorar tratamento de erros no frontend

---

## 📝 Arquivos Relacionados

- **Script de diagnóstico**: `scripts/diagnose-rls-upload-issue.cjs`
- **Relatório JSON**: `scripts/rls-diagnostic-report-2025-09-01T04-33-21-638Z.json`
- **Migração do bucket**: `supabase/migrations/20250202_setup_course_covers_storage.sql`
- **Componente afetado**: `src/components/admin/CourseCoverManager.tsx`
- **Documentação anterior**: `STORAGE_RLS_FIX.md`

---

## ⚠️ Observações Importantes

1. **Erro enganoso**: O erro "RLS policy" pode mascarar problemas de configuração básica
2. **Teste em ambiente**: Sempre testar soluções em ambiente de desenvolvimento primeiro
3. **Backup**: Fazer backup antes de aplicar mudanças em produção
4. **Monitoramento**: Implementar logs mais detalhados para facilitar diagnósticos futuros

---

*Relatório gerado em: 2025-09-01 04:33 UTC*
*Script de diagnóstico: diagnose-rls-upload-issue.cjs*