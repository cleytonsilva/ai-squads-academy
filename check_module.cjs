const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

supabase
  .from('modules')
  .select('title, content_jsonb')
  .eq('id', '84cbbe22-ec35-4137-8008-dbde567cd60a')
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.error('Erro:', error);
    } else {
      console.log('Título:', data.title);
      const html = data.content_jsonb?.html || data.content_jsonb?.content || '';
      console.log('Conteúdo HTML atual:');
      console.log(html);
      console.log('\nContém "teste"?', html.includes('teste'));
    }
  });