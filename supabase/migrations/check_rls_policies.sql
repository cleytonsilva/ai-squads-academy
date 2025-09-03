-- Verificar se RLS está habilitado na tabela modules
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE tablename = 'modules' AND schemaname = 'public';

-- Listar todas as políticas RLS da tabela modules
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'modules'
ORDER BY policyname;

-- Verificar permissões das roles anon e authenticated na tabela modules
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'modules'
AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;