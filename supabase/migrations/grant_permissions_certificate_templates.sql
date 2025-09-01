-- Verificar permissões atuais (apenas para referência)
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE table_schema = 'public' AND table_name = 'certificate_templates' 
-- AND grantee IN ('anon', 'authenticated') 
-- ORDER BY table_name, grantee;

-- Conceder permissões básicas de leitura para role anon
GRANT SELECT ON certificate_templates TO anon;

-- Conceder permissões completas para role authenticated
GRANT ALL PRIVILEGES ON certificate_templates TO authenticated;

-- Comentário explicativo
COMMENT ON TABLE certificate_templates IS 'Templates de certificados com permissões para anon (SELECT) e authenticated (ALL)';