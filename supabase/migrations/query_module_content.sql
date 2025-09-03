-- Consulta para verificar o conteúdo do módulo "Introdução à Cibersegurança"
DO $$
DECLARE
    module_record RECORD;
    html_content TEXT;
    contains_teste BOOLEAN;
BEGIN
    -- Buscar o módulo
    SELECT id, title, content_jsonb INTO module_record
    FROM modules 
    WHERE title = 'Introdução à Cibersegurança'
    LIMIT 1;
    
    IF module_record IS NULL THEN
        RAISE NOTICE 'Módulo não encontrado';
        RETURN;
    END IF;
    
    -- Extrair HTML do content_jsonb
    html_content := COALESCE(
        module_record.content_jsonb->>'html',
        module_record.content_jsonb->>'content',
        ''
    );
    
    -- Verificar se contém 'teste'
    contains_teste := html_content LIKE '%teste%';
    
    -- Exibir resultados
    RAISE NOTICE 'ID do módulo: %', module_record.id;
    RAISE NOTICE 'Título: %', module_record.title;
    RAISE NOTICE 'Tamanho do HTML: % caracteres', LENGTH(html_content);
    RAISE NOTICE 'Contém "teste": %', contains_teste;
    
    IF contains_teste THEN
        RAISE NOTICE 'Posição da palavra "teste": %', POSITION('teste' IN html_content);
    END IF;
    
    -- Mostrar primeiros 200 caracteres
    RAISE NOTICE 'Primeiros 200 caracteres: %', LEFT(html_content, 200);
    
    -- Mostrar últimos 200 caracteres
    RAISE NOTICE 'Últimos 200 caracteres: %', RIGHT(html_content, 200);
    
END $$;