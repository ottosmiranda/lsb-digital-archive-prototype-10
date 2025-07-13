
-- Configurar cron job para rotação de "Novidades no Acervo" a cada 3 dias às 23:59h
SELECT cron.schedule(
  'recent-additions-rotation',
  '59 23 */3 * *',
  $$
  SELECT
    net.http_post(
        url:='https://acnympbxfptajtxvmkqn.supabase.co/functions/v1/recent-additions-rotation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbnltcGJ4ZnB0YWp0eHZta3FuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDMzODcsImV4cCI6MjA2NjI3OTM4N30.7cAJTwzL28v0QyycI2wQyEotlQh34Nygfp4WnSZR66Q"}'::jsonb,
        body:='{"trigger": "recent_additions_cron"}'::jsonb
    ) as request_id;
  $$
);
