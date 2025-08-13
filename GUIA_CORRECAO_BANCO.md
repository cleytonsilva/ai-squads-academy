# Guia para Correção do Banco de Dados - Sistema de Badges

## Problema Identificado
O sistema de badges está apresentando erros devido a colunas e tabelas faltantes no banco de dados Supabase.

## Solução: Aplicar Script SQL Manualmente

### Passo 1: Acessar o Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto
4. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o Script de Correção
1. Abra o arquivo `fix_database_manual.sql` que foi criado na raiz do projeto
2. Copie o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. **IMPORTANTE**: Execute o script **bloco por bloco** (não tudo de uma vez)

### Passo 3: Verificar se as Correções Funcionaram
Após executar o script, verifique se:

1. **Tabela badges** tem as colunas:
   - `category` (VARCHAR)
   - `title` (VARCHAR)

2. **Tabela badge_challenges** tem a coluna:
   - `is_active` (BOOLEAN)

3. **Novas tabelas foram criadas**:
   - `challenge_participations`
   - `user_certificates`

4. **Políticas RLS estão ativas** nas novas tabelas

### Passo 4: Testar o Sistema
Após aplicar as correções:
1. Recarregue a página da aplicação
2. Tente criar um novo badge como administrador
3. Verifique se não há mais erros no console do navegador

## Erros Corrigidos

### Erros de Banco de Dados:
- ✅ `column badges_1.category does not exist`
- ✅ `column badge_challenges.is_active does not exist`
- ✅ `column badges_1.title does not exist`
- ✅ `relation "public.challenge_participations" does not exist`
- ✅ Perfis duplicados causando erro `multiple (or no) rows returned`

### Erros de React:
- ✅ `Objects are not valid as a React child` (corrigido uso incorreto do toast)
- ✅ Toasts usando sintaxe antiga corrigidos para `toast.success()` e `toast.error()`

## Arquivos Corrigidos
- `AchievementManagement.tsx` - Corrigido uso do toast
- `QuizRunner.tsx` - Corrigido múltiplos usos do toast
- `CourseView.tsx` - Corrigido toasts de XP e módulos
- `VoiceInterface.tsx` - Corrigido toasts de conexão

## Próximos Passos
Após aplicar as correções:
1. O sistema de badges deve funcionar normalmente
2. Administradores poderão criar badges e certificados
3. Estudantes poderão visualizar suas conquistas
4. Não haverá mais erros de colunas inexistentes

## Suporte
Se ainda houver problemas após aplicar as correções:
1. Verifique o console do navegador para novos erros
2. Confirme que todas as migrações foram aplicadas corretamente
3. Teste com um usuário administrador válido

---
**Nota**: Este guia resolve os problemas identificados nos logs de erro fornecidos pelo usuário.