# Correção das Políticas RLS do Storage para Webhook do Replicate

## 🔍 Problema Identificado

Analisando os logs da Edge Function, identifiquei que:

1. ✅ A imagem foi gerada com sucesso pelo Replicate (predictionId: `qcnywa3r3nrme0cs0d5tyb5grc`)
2. ✅ A predição foi salva no banco de dados
3. ❌ **O webhook do Replicate não consegue fazer upload da imagem para o storage**
4. ❌ Erro: `new row violates row-level security policy`

## 🎯 Causa Raiz

As políticas RLS (Row Level Security) do bucket `course-images` estão configuradas para permitir upload apenas para:
- Usuários autenticados com role `admin` ou `instructor`

Porém, o **webhook do Replicate** executa usando o `service_role`, que não está contemplado nas políticas atuais.

## 🔧 Solução

### Opção 1: Correção Manual via Dashboard (RECOMENDADO)

1. **Acesse o Painel do Supabase:**
   - URL: https://supabase.com/dashboard/project/ncrlojjfkhevjotchhxi/storage/policies

2. **Vá para Storage > Policies**

3. **Adicione uma nova política para INSERT:**
   - **Nome:** `Service role can upload course images`
   - **Operação:** `INSERT`
   - **Condição:** `auth.role() = 'service_role'`
   - **Bucket:** `course-images`

4. **Adicione uma nova política para UPDATE:**
   - **Nome:** `Service role can update course images`
   - **Operação:** `UPDATE`
   - **Condição:** `auth.role() = 'service_role'`
   - **Bucket:** `course-images`

5. **Adicione uma nova política para DELETE (opcional):**
   - **Nome:** `Service role can delete course images`
   - **Operação:** `DELETE`
   - **Condição:** `auth.role() = 'service_role'`
   - **Bucket:** `course-images`

### Opção 2: SQL Manual (se tiver acesso direto ao banco)

```sql
-- Política para INSERT
CREATE POLICY "Service role can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
);

-- Política para UPDATE
CREATE POLICY "Service role can update course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
)
WITH CHECK (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
);

-- Política para DELETE
CREATE POLICY "Service role can delete course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-images' AND
  auth.role() = 'service_role'
);
```

## 🧪 Como Testar

Após aplicar as correções:

1. **Teste a geração de capa:**
   - Acesse: http://localhost:8080/admin/courses/7a5c00f7-6c22-4eb6-a2e8-e5e3db9be0e0
   - Clique em "Gerar Capa com IA"
   - Escolha o engine "flux" ou "recraft"

2. **Monitore os logs:**
   - Edge Function `generate-course-cover`: Deve mostrar predição criada
   - Edge Function `replicate-webhook`: Deve mostrar processamento da imagem
   - Curso deve ser atualizado com a nova capa

## 📋 Fluxo Completo Esperado

1. **Frontend** → Chama `generate-course-cover`
2. **generate-course-cover** → Cria predição no Replicate
3. **Replicate** → Gera imagem e chama webhook
4. **replicate-webhook** → Faz download da imagem
5. **replicate-webhook** → Faz upload para `course-images` bucket ⚠️ **AQUI ESTÁ FALHANDO**
6. **replicate-webhook** → Atualiza `cover_image_url` do curso
7. **Frontend** → Mostra nova capa

## 🔍 Logs de Diagnóstico

Para verificar se a correção funcionou, monitore estes logs:

### Edge Function `replicate-webhook`:
```
[WEBHOOK] Processando predição {id} - Status: succeeded
[WEBHOOK] Processando imagem: {url}
[WEBHOOK] Imagem salva localmente: {local_url}
[WEBHOOK] Capa do curso {course_id} atualizada com URL local
```

### Se ainda houver erro:
```
[WEBHOOK] Erro ao processar resultado: StorageApiError: new row violates row-level security policy
```

## ✅ Verificação Final

Após a correção, você deve ver:
- ✅ Imagem gerada pelo Replicate
- ✅ Upload bem-sucedido para o storage
- ✅ Curso atualizado com nova capa
- ✅ Capa visível na interface

---

**Nota:** Este problema afeta apenas a funcionalidade de geração automática de capas. O upload manual de capas continua funcionando normalmente para admins/instructors.