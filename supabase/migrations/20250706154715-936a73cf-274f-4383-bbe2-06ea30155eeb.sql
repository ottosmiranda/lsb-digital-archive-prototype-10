
-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar tabela para controle de rotação de conteúdo
CREATE TABLE public.featured_content_rotation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('weekly_highlights', 'daily_media')),
  content_data JSONB NOT NULL,
  rotation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_featured_content_rotation_type_active ON public.featured_content_rotation(content_type, is_active);
CREATE INDEX idx_featured_content_rotation_date ON public.featured_content_rotation(rotation_date DESC);

-- Habilitar RLS
ALTER TABLE public.featured_content_rotation ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública
CREATE POLICY "Anyone can view active featured content" 
  ON public.featured_content_rotation 
  FOR SELECT 
  USING (is_active = true);

-- Política para permitir inserção/atualização por funções edge (usando service role)
CREATE POLICY "Service role can manage featured content" 
  ON public.featured_content_rotation 
  FOR ALL 
  USING (true);

-- Configurar cron jobs para rotação automática
-- Rotação semanal (Destaques da Semana) - toda segunda-feira às 00h Brasília (3h UTC)
SELECT cron.schedule(
  'weekly-highlights-rotation',
  '0 3 * * 1',
  $$
  SELECT
    net.http_post(
        url:='https://acnympbxfptajtxvmkqn.supabase.co/functions/v1/weekly-content-rotation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbnltcGJ4ZnB0YWp0eHZta3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDMzODcsImV4cCI6MjA2NjI3OTM4N30.7cAJTwzL28v0QyycI2wQyEotlQh34Nygfp4WnSZR66Q"}'::jsonb,
        body:='{"trigger": "weekly_cron"}'::jsonb
    ) as request_id;
  $$
);

-- Rotação diária (Mídia em Destaque) - todo dia às 00h Brasília (3h UTC)
SELECT cron.schedule(
  'daily-media-rotation',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://acnympbxfptajtxvmkqn.supabase.co/functions/v1/daily-media-rotation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbnltcGJ4ZnB0YWp0eHZta3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDMzODcsImV4cCI6MjA2NjI3OTM4N30.7cAJTwzL28v0QyycI2wQyEotlQh34Nygfp4WnSZR66Q"}'::jsonb,
        body:='{"trigger": "daily_cron"}'::jsonb
    ) as request_id;
  $$
);
