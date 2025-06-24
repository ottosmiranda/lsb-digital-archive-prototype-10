
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can view platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated users can insert platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated users can update platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated users can delete platform settings" ON public.platform_settings;

-- Create more appropriate policies for platform settings
-- Allow all authenticated users to read platform settings (needed for app functionality)
CREATE POLICY "Anyone can view platform settings"
  ON public.platform_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to modify platform settings
-- (In a production environment, you might want to restrict this to admin users only)
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
