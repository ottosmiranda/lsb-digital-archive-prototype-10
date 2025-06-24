
-- Create platform_settings table for global platform configurations
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Create admin-only policies for platform_settings
-- Only authenticated users can access platform settings (admin check will be in application layer)
CREATE POLICY "Authenticated users can view platform settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert platform settings"
  ON public.platform_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update platform settings"
  ON public.platform_settings
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete platform settings"
  ON public.platform_settings
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better performance
CREATE INDEX idx_platform_settings_key ON public.platform_settings(setting_key);

-- Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value) VALUES
('vlibras_config', '{"enabled": false, "position": "bottom-right", "avatar": "icaro", "opacity": 1, "width": 320, "height": 240}'),
('spotify_config', '{"enabled": false, "client_id": "", "client_secret": ""}')
ON CONFLICT (setting_key) DO NOTHING;
