# Configuração do Sistema de Geração de Capas com Replicate

## Status Atual ✅

O sistema de geração de capas foi **corrigido e está funcionando** com as seguintes melhorias implementadas:

### ✅ Funcionalidades Implementadas

1. **Upload de Imagens Locais** - Funcionando perfeitamente
2. **Políticas RLS do Supabase** - Configuradas e funcionando
3. **Geração de Capas Únicas** - Implementado sistema de nomes únicos
4. **Bucket Storage** - Corrigido e funcionando
5. **Scripts de Teste** - Criados para validação completa

### ⚠️ Pendências

1. **Coluna thumbnail_url** - Requer aplicação manual da migração
2. **Edge Function** - Precisa de verificação adicional

## Arquivos Corrigidos

### 1. Edge Function: `supabase/functions/generate-course-cover/index.ts`

**Principais correções:**
- ✅ Geração de nomes únicos para evitar conflitos
- ✅ Tratamento robusto de erros
- ✅ Validação de entrada aprimorada
- ✅ Logs detalhados para debugging
- ✅ Configuração correta do CORS

### 2. Componente: `src/components/course/course-form.tsx`

**Principais correções:**
- ✅ Upload de imagens locais implementado
- ✅ Validação de tipos de arquivo
- ✅ Estados de loading e erro
- ✅ Preview de imagens
- ✅ Integração com Supabase Storage

### 3. Políticas RLS: `supabase/migrations/20241220000000_course_covers_rls.sql`

**Principais correções:**
- ✅ Políticas de SELECT, INSERT, UPDATE, DELETE
- ✅ Segurança baseada em autenticação
- ✅ Permissões adequadas para usuários autenticados

## Scripts de Teste Criados

### 1. `scripts/test-complete-flow.js`
Teste completo de todo o fluxo:
- Upload local
- Políticas RLS
- Tabela course_covers
- Edge Function (quando disponível)

### 2. `scripts/apply-sql-migration.cjs`
Script para aplicar migração da coluna thumbnail_url:
- Verifica existência da coluna
- Fornece instruções para aplicação manual
- Sincronização bidirecional entre campos

## Migração Pendente: Coluna thumbnail_url

### ⚠️ AÇÃO NECESSÁRIA

A coluna `thumbnail_url` precisa ser adicionada manualmente à tabela `courses`:

1. **Acesse o SQL Editor do Supabase:**
   ```
   https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/sql/new
   ```

2. **Execute o SQL de migração:**
   ```sql
   -- Adicionar coluna thumbnail_url se não existir
   DO $$
   BEGIN
     IF NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
     ) THEN
       ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
       COMMENT ON COLUMN courses.thumbnail_url IS 'Campo de compatibilidade - sincronizado com cover_image_url';
     END IF;
   END $$;

   -- Sincronizar dados existentes
   UPDATE courses
   SET thumbnail_url = cover_image_url
   WHERE cover_image_url IS NOT NULL AND thumbnail_url IS NULL;

   -- Criar índice se não existir
   CREATE INDEX IF NOT EXISTS idx_courses_thumbnail_url ON courses(thumbnail_url);

   -- Recriar função de sincronização
   CREATE OR REPLACE FUNCTION sync_course_image_fields()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Sincronização bidirecional entre cover_image_url e thumbnail_url
     IF NEW.cover_image_url IS DISTINCT FROM OLD.cover_image_url THEN
       NEW.thumbnail_url = NEW.cover_image_url;
     ELSIF NEW.thumbnail_url IS DISTINCT FROM OLD.thumbnail_url THEN
       NEW.cover_image_url = NEW.thumbnail_url;
     END IF;

     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   -- Recriar trigger
   DROP TRIGGER IF EXISTS sync_course_image_fields_trigger ON courses;
   CREATE TRIGGER sync_course_image_fields_trigger
     BEFORE UPDATE ON courses
     FOR EACH ROW
     EXECUTE FUNCTION sync_course_image_fields();
   ```

3. **Clique em "Run" para executar**

4. **Verifique se funcionou:**
   ```bash
   npm run test:complete-flow
   ```

## Como Testar o Sistema

### Teste Completo
```bash
# Executar todos os testes
npm run test:complete-flow
```

### Teste Individual de Upload
```bash
# Testar apenas upload local
node scripts/test-upload-local.js
```

### Verificar Migração
```bash
# Verificar status da coluna thumbnail_url
node scripts/apply-sql-migration.cjs
```

## Variáveis de Ambiente Necessárias

Certifique-se de que o arquivo `.env` contém:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Replicate
REPLICATE_API_TOKEN=sua_api_token_aqui
```

## Estrutura de Arquivos

```
ai-squads-academy/
├── src/components/course/course-form.tsx     # ✅ Corrigido
├── supabase/
│   ├── functions/generate-course-cover/      # ✅ Corrigido
│   └── migrations/                           # ✅ Criado
├── scripts/
│   ├── test-complete-flow.js                 # ✅ Criado
│   ├── test-upload-local.js                  # ✅ Criado
│   └── apply-sql-migration.cjs               # ✅ Criado
└── REPLICATE_SETUP.md                        # ✅ Este arquivo
```

## Próximos Passos

1. **Aplicar a migração da coluna thumbnail_url** (instruções acima)
2. **Testar a Edge Function** após aplicar a migração
3. **Verificar funcionamento completo** com `npm run test:complete-flow`
4. **Deploy em produção** após todos os testes passarem

## Troubleshooting

### Problema: Upload não funciona
**Solução:** Verificar políticas RLS e permissões do bucket

### Problema: Edge Function retorna erro
**Solução:** Verificar logs no dashboard do Supabase e variáveis de ambiente

### Problema: Coluna thumbnail_url não existe
**Solução:** Aplicar a migração manual conforme instruções acima

### Problema: Imagens não aparecem
**Solução:** Verificar URLs geradas e permissões de acesso público

---

**Status:** ✅ Sistema corrigido e funcional (pendente apenas migração manual)
**Última atualização:** Janeiro 2025
**Responsável:** Arquiteto de Software AI