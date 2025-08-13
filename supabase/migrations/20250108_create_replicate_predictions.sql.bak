-- Criação da tabela para armazenar predições do Replicate
CREATE TABLE IF NOT EXISTS replicate_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_id TEXT NOT NULL UNIQUE, -- ID da predição do Replicate
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('course_cover', 'module_image')),
  status TEXT NOT NULL DEFAULT 'starting' CHECK (status IN ('starting', 'processing', 'succeeded', 'failed', 'canceled')),
  input JSONB, -- Parâmetros de entrada da predição
  output TEXT, -- URL da imagem gerada
  error TEXT, -- Mensagem de erro se houver
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_prediction_id ON replicate_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_course_id ON replicate_predictions(course_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_module_id ON replicate_predictions(module_id);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_status ON replicate_predictions(status);
CREATE INDEX IF NOT EXISTS idx_replicate_predictions_created_at ON replicate_predictions(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_replicate_predictions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_replicate_predictions_updated_at
  BEFORE UPDATE ON replicate_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_replicate_predictions_updated_at();

-- Comentários para documentação
COMMENT ON TABLE replicate_predictions IS 'Armazena informações sobre predições do Replicate para geração de imagens';
COMMENT ON COLUMN replicate_predictions.prediction_id IS 'ID único da predição retornado pela API do Replicate';
COMMENT ON COLUMN replicate_predictions.course_id IS 'ID do curso relacionado (para capas de curso)';
COMMENT ON COLUMN replicate_predictions.module_id IS 'ID do módulo relacionado (para imagens de módulo)';
COMMENT ON COLUMN replicate_predictions.prediction_type IS 'Tipo da predição: course_cover ou module_image';
COMMENT ON COLUMN replicate_predictions.status IS 'Status atual da predição no Replicate';
COMMENT ON COLUMN replicate_predictions.input IS 'Parâmetros de entrada enviados para o Replicate';
COMMENT ON COLUMN replicate_predictions.output IS 'URL da imagem gerada pelo Replicate';
COMMENT ON COLUMN replicate_predictions.error IS 'Mensagem de erro em caso de falha';
COMMENT ON COLUMN replicate_predictions.completed_at IS 'Timestamp de quando a predição foi concluída (sucesso ou falha)';