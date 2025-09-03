-- Verificar se a palavra 'teste' está presente no módulo após atualização direta
-- Consulta para verificar o conteúdo atual do módulo "Introdução à Cibersegurança"

SELECT 
    id,
    title,
    content_jsonb->>'html' as html_content,
    LENGTH(content_jsonb->>'html') as html_length,
    CASE 
        WHEN content_jsonb->>'html' LIKE '%teste%' THEN 'SIM - ENCONTRADO'
        ELSE 'NÃO - NÃO ENCONTRADO'
    END as contem_teste,
    CASE 
        WHEN content_jsonb->>'html' LIKE '%teste%' THEN 
            POSITION('teste' IN content_jsonb->>'html')
        ELSE NULL
    END as posicao_teste,
    -- Mostrar contexto ao redor da palavra 'teste' se encontrada
    CASE 
        WHEN content_jsonb->>'html' LIKE '%teste%' THEN 
            SUBSTRING(
                content_jsonb->>'html', 
                GREATEST(1, POSITION('teste' IN content_jsonb->>'html') - 50),
                100
            )
        ELSE 'N/A'
    END as contexto_teste
FROM modules 
WHERE title = 'Introdução à Cibersegurança'
LIMIT 1;

-- Verificar também se há algum registro de atualização recente
SELECT 
    'Informações adicionais:' as info,
    updated_at,
    created_at,
    content_jsonb->>'last_saved' as last_saved,
    content_jsonb->>'version' as version
FROM modules 
WHERE title = 'Introdução à Cibersegurança'
LIMIT 1;