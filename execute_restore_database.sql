-- EXECUÇÃO DA RESTAURAÇÃO COMPLETA DO BANCO DE DADOS
-- AI Squads Academy - Script para executar no Supabase Dashboard
-- Este script combina a restauração e configuração do admin

-- ============================================================================
-- PASSO 1: EXECUTAR RESTAURAÇÃO COMPLETA
-- ============================================================================

-- Primeiro, execute todo o conteúdo do arquivo restore_complete_database.sql
-- Copie e cole o conteúdo completo no SQL Editor do Supabase Dashboard

-- ============================================================================
-- PASSO 2: VERIFICAR RESULTADO DA RESTAURAÇÃO
-- ============================================================================

-- Verificar tabelas criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- PASSO 3: CONFIGURAR USUÁRIO ADMIN (SE NECESSÁRIO)
-- ============================================================================

-- Verificar se o usuário admin existe
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'cleyton7silva@gmail.com';

-- Verificar perfil do admin
SELECT 
    p.id,
    p.user_id,
    p.name,
    p.email,
    p.role,
    p.created_at,
    u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.user_id = u.id
WHERE p.email = 'cleyton7silva@gmail.com';

-- ============================================================================
-- PASSO 4: RESETAR SENHA DO ADMIN (SE NECESSÁRIO)
-- ============================================================================

-- Se o usuário admin não conseguir fazer login, execute este comando:
-- UPDATE auth.users 
-- SET 
--     encrypted_password = crypt('TempPassword123!', gen_salt('bf')),
--     email_confirmed_at = NOW(),
--     updated_at = NOW()
-- WHERE email = 'cleyton7silva@gmail.com';

-- ============================================================================
-- PASSO 5: VERIFICAÇÃO FINAL
-- ============================================================================

-- Contar registros em cada tabela
SELECT 'profiles' as tabela, COUNT(*) as registros FROM public.profiles
UNION ALL
SELECT 'courses' as tabela, COUNT(*) as registros FROM public.courses
UNION ALL
SELECT 'modules' as tabela, COUNT(*) as registros FROM public.modules
UNION ALL
SELECT 'lessons' as tabela, COUNT(*) as registros FROM public.lessons
UNION ALL
SELECT 'enrollments' as tabela, COUNT(*) as registros FROM public.enrollments
UNION ALL
SELECT 'lesson_progress' as tabela, COUNT(*) as registros FROM public.lesson_progress
UNION ALL
SELECT 'badges' as tabela, COUNT(*) as registros FROM public.badges
UNION ALL
SELECT 'user_badges' as tabela, COUNT(*) as registros FROM public.user_badges
UNION ALL
SELECT 'certificates' as tabela, COUNT(*) as registros FROM public.certificates
UNION ALL
SELECT 'badge_templates' as tabela, COUNT(*) as registros FROM public.badge_templates
UNION ALL
SELECT 'certificate_templates' as tabela, COUNT(*) as registros FROM public.certificate_templates
UNION ALL
SELECT 'course_completions' as tabela, COUNT(*) as registros FROM public.course_completions
UNION ALL
SELECT 'replicate_predictions' as tabela, COUNT(*) as registros FROM public.replicate_predictions
ORDER BY tabela;

-- Status final
SELECT 
    'RESTAURAÇÃO CONCLUÍDA!' as status,
    NOW() as timestamp,
    (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    ) as total_tabelas,
    (
        SELECT COUNT(*) 
        FROM public.profiles 
        WHERE role = 'admin'
    ) as admins_configurados;

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================

/*
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Copie e cole o conteúdo do arquivo restore_complete_database.sql
4. Execute o script
5. Execute este script (execute_restore_database.sql) para verificar
6. Se necessário, descomente e execute o comando de reset de senha
7. Teste o login na aplicação

Se tudo estiver funcionando:
- Todas as tabelas estarão criadas
- RLS estará configurado
- Usuário admin estará configurado
- Aplicação estará pronta para uso
*/