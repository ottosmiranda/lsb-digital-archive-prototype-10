
import { supabase } from '@/integrations/supabase/client';
import { VLibrasConfig } from '@/types/vlibrasTypes';

export interface SpotifyConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
}

export interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

class PlatformSettingsService {
  private readonly VLIBRAS_SETTING_KEY = 'vlibras_config';
  private readonly SPOTIFY_SETTING_KEY = 'spotify_config';

  async getPlatformSetting(key: string): Promise<{ data: PlatformSetting | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('setting_key', key)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('Error fetching platform setting:', error);
      return { data: null, error };
    }
  }

  async savePlatformSetting(key: string, value: any): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('platform_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        });

      return { error };
    } catch (error) {
      console.error('Error saving platform setting:', error);
      return { error };
    }
  }

  async getVLibrasConfig(): Promise<{ data: VLibrasConfig | null; error: any }> {
    const { data, error } = await this.getPlatformSetting(this.VLIBRAS_SETTING_KEY);
    
    if (error) return { data: null, error };
    
    return { 
      data: data ? data.setting_value as VLibrasConfig : null, 
      error: null 
    };
  }

  async saveVLibrasConfig(config: VLibrasConfig): Promise<{ error: any }> {
    return this.savePlatformSetting(this.VLIBRAS_SETTING_KEY, config);
  }

  async getSpotifyConfig(): Promise<{ data: SpotifyConfig | null; error: any }> {
    const { data, error } = await this.getPlatformSetting(this.SPOTIFY_SETTING_KEY);
    
    if (error) return { data: null, error };
    
    return { 
      data: data ? data.setting_value as SpotifyConfig : null, 
      error: null 
    };
  }

  async saveSpotifyConfig(config: SpotifyConfig): Promise<{ error: any }> {
    return this.savePlatformSetting(this.SPOTIFY_SETTING_KEY, config);
  }
}

export const platformSettingsService = new PlatformSettingsService();
