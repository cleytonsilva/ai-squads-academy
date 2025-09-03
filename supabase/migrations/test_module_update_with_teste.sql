-- Teste de atualização do módulo com a palavra 'teste'
-- Este script testa se as políticas RLS corrigidas permitem atualizações

-- 1. Verificar o conteúdo atual do módulo
SELECT 
    id,
    title,
    content_jsonb->>'html' as current_html,
    LENGTH(content_jsonb->>'html') as html_length,
    CASE 
        WHEN content_jsonb->>'html' LIKE '%teste%' THEN 'SIM'
        ELSE 'NÃO'
    END as contains_teste
FROM modules 
WHERE title = 'Introdução à Cibersegurança';

-- 2. Tentar atualizar o módulo adicionando 'teste' ao final do último parágrafo
UPDATE modules 
SET content_jsonb = jsonb_set(
    content_jsonb,
    '{html}',
    to_jsonb(REPLACE(content_jsonb->>'html', '</p>', ' teste</p>'))
)
WHERE title = 'Introdução à Cibersegurança'
AND NOT (content_jsonb->>'html' LIKE '%teste%');

-- 3. Verificar se a atualização foi bem-sucedida
SELECT 
    id,
    title,
    content_jsonb->>'html' as updated_html,
    LENGTH(content_jsonb->>'html') as html_length,
    CASE 
        WHEN content_jsonb->>'html' LIKE '%teste%' THEN 'SIM - SUCESSO!'
        ELSE 'NÃO - FALHA!'
    END as contains_teste_after_update,
    POSITION('teste' IN content_jsonb->>'html') as teste_position
FROM modules 
WHERE title = 'Introdução à Cibersegurança';

-- 4. Mostrar contexto da palavra 'teste' se encontrada
SELECT 
    'Contexto da palavra teste:' as info,
    SUBSTRING(
        content_jsonb->>'html',
        GREATEST(1, POSITION('teste' IN content_jsonb->>'html') - 50),
        100
    ) as context
FROM modules 
WHERE title = 'Introdução à Cibersegurança'
AND content_jsonb->>'html' LIKE '%teste%';