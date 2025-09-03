-- Verificar o conteúdo atual do módulo de introdução
DO $$
DECLARE
    module_record RECORD;
    html_content TEXT;
    contains_test BOOLEAN;
BEGIN
    SELECT id, title, content_jsonb INTO module_record
    FROM modules 
    WHERE id = '84cbbe22-ec35-4137-8008-dbde567cd60a';
    
    IF FOUND THEN
        html_content := module_record.content_jsonb->>'html';
        contains_test := html_content LIKE '%teste%';
        
        RAISE NOTICE 'Módulo ID: %', module_record.id;
        RAISE NOTICE 'Título: %', module_record.title;
        RAISE NOTICE 'Contém "teste": %', contains_test;
        RAISE NOTICE 'Tamanho do HTML: %', LENGTH(html_content);
        
        IF contains_test THEN
            RAISE NOTICE 'Posição da palavra "teste": %', POSITION('teste' IN html_content);
        END IF;
    ELSE
        RAISE NOTICE 'Módulo não encontrado';
    END IF;
END $$;