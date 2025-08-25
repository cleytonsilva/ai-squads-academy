-- Consulta para comparar os dois cursos específicos
SELECT 
  'CURSO PRINCIPAL' as tipo,
  id,
  title,
  cover_image_url,
  status,
  is_published,
  ai_generated,
  created_at,
  updated_at,
  description
FROM courses 
WHERE id IN ('8816aa6b-b5e5-4757-92af-ec2de1d89111', 'fddbc02b-e27c-45fb-a35c-b6fed692db7a')
ORDER BY title;

-- Consulta para verificar capas na tabela course_covers
SELECT 
  'CAPA SEPARADA' as tipo,
  cc.id,
  cc.course_id,
  c.title as course_title,
  cc.image_url,
  cc.is_active,
  cc.created_at,
  cc.updated_at
FROM course_covers cc
JOIN courses c ON cc.course_id = c.id
WHERE cc.course_id IN ('8816aa6b-b5e5-4757-92af-ec2de1d89111', 'fddbc02b-e27c-45fb-a35c-b6fed692db7a')
ORDER BY c.title, cc.created_at DESC;