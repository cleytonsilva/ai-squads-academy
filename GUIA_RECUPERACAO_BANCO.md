# 🚨 GUIA DE RECUPERAÇÃO DO BANCO DE DADOS

## 📋 Situação Atual
- ✅ **Aplicação Frontend:** Funcionando perfeitamente
- ✅ **Código Fonte:** Intacto e sem problemas
- ❌ **Banco de Dados:** Apenas tabela `profiles` restante
- ❌ **Docker/Supabase Local:** Não funcionando

## 🎯 Solução Rápida e Eficaz

### Passo 1: Acessar Supabase Dashboard
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto **AI Squads Academy**
4. Vá para **SQL Editor** no menu lateral

### Passo 2: Executar Restauração Completa
1. Abra o arquivo `restore_complete_database.sql`
2. **Copie TODO o conteúdo** (392 linhas)
3. **Cole no SQL Editor** do Supabase
4. Clique em **RUN** para executar

### Passo 3: Verificar Restauração
1. Abra o arquivo `execute_restore_database.sql`
2. **Copie e execute** as consultas de verificação
3. Confirme que todas as **13 tabelas** foram criadas:
   - ✅ profiles
   - ✅ courses
   - ✅ modules
   - ✅ lessons
   - ✅ enrollments
   - ✅ lesson_progress
   - ✅ badges
   - ✅ user_badges
   - ✅ certificates
   - ✅ badge_templates
   - ✅ certificate_templates
   - ✅ course_completions
   - ✅ replicate_predictions

### Passo 4: Configurar Acesso Admin
1. Execute esta consulta para resetar sua senha:
```sql
UPDATE auth.users 
SET 
    encrypted_password = crypt('TempPassword123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'cleyton7silva@gmail.com';
```

2. Faça login na aplicação com:
   - **Email:** cleyton7silva@gmail.com
   - **Senha:** TempPassword123!

3. **Altere a senha** imediatamente após o login

## 🎉 Resultado Esperado

Após executar todos os passos:
- ✅ **13 tabelas** restauradas com estrutura completa
- ✅ **RLS (Row Level Security)** configurado
- ✅ **Políticas de segurança** implementadas
- ✅ **Índices de performance** criados
- ✅ **Funções auxiliares** restauradas
- ✅ **Triggers** configurados
- ✅ **Usuário admin** configurado
- ✅ **Aplicação** pronta para desenvolvimento

## 🔧 Arquivos Importantes

| Arquivo | Descrição |
|---------|----------|
| `restore_complete_database.sql` | Script principal de restauração (EXECUTE PRIMEIRO) |
| `execute_restore_database.sql` | Script de verificação e diagnóstico |
| `reset_admin_password.sql` | Reset de senha do admin (se necessário) |

## ⚡ Vantagens desta Abordagem

1. **Rápida:** Execução em minutos via Supabase Dashboard
2. **Completa:** Restaura toda a estrutura do banco
3. **Segura:** Mantém todas as políticas de segurança
4. **Eficiente:** Não depende do Docker local
5. **Testada:** Script baseado nas migrações existentes

## 🚀 Próximos Passos

Após a restauração:
1. **Teste o login** na aplicação
2. **Verifique as funcionalidades** principais
3. **Continue o desenvolvimento** normalmente
4. **Considere configurar backup** automático

## 🚨 Problemas Conhecidos e Soluções

### Erro "Falha ao criar curso. Verifique permissões/autenticação"

**Problema:** Políticas RLS da tabela `courses` não permitem INSERT para admins.

**Solução Rápida:**
1. Vá para o Supabase Dashboard → SQL Editor
2. Execute o arquivo `apply_courses_policies_fix.sql`
3. Teste novamente a criação de cursos

**Solução Completa:**
- Execute o `restore_complete_database.sql` atualizado (já inclui as políticas corretas)

**Arquivos relacionados:**
- `apply_courses_policies_fix.sql` - Correção específica para políticas de courses
- `fix_courses_insert_policy.sql` - Script de diagnóstico das políticas

---

**💡 Dica:** Mantenha este guia salvo para futuras referências. A estrutura do banco agora estará completa e pronta para o desenvolvimento contínuo da plataforma!