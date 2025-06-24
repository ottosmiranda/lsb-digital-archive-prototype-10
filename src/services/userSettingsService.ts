
import { supabase } from '@/integrations/supabase/client';
import { VLibrasConfig } from '@/types/vlibrasTypes';

export interface UserSetting {
  id: string;
  user_id: string;
  setting_key: string;
  setting_value: any;
  created_at: string;
  updated_at: string;
}

class UserSettingsService {
  private readonly VLIBRAS_SETTING_KEY = 'vlibras_config';

  async getUserSetting(userId: string, key: string): Promise<{ data: UserSetting | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .eq('setting_key', key)
        .maybeSingle();

      return { data, error };
    } catch (error) {
      console.error('Error fetching user setting:', error);
      return { data: null, error };
    }
  }

  async saveUserSetting(userId: string, key: string, value: any): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        });

      return { error };
    } catch (error) {
      console.error('Error saving user setting:', error);
      return { error };
    }
  }

  async getVLibrasConfig(userId: string): Promise<{ data: VLibrasConfig | null; error: any }> {
    const { data, error } = await this.getUserSetting(userId, this.VLIBRAS_SETTING_KEY);
    
    if (error) return { data: null, error };
    
    return { 
      data: data ? data.setting_value as VLibrasConfig : null, 
      error: null 
    };
  }

  async saveVLibrasConfig(userId: string, config: VLibrasConfig): Promise<{ error: any }> {
    return this.saveUserSetting(userId, this.VLIBRAS_SETTING_KEY, config);
  }

  // Migration utility to move localStorage to database
  async migrateLocalStorageToDatabase(userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const localConfig = localStorage.getItem('vlibras_config');
      if (!localConfig) return { success: true };

      const config = JSON.parse(localConfig) as VLibrasConfig;
      const { error } = await this.saveVLibrasConfig(userId, config);
      
      if (!error) {
        // Remove from localStorage after successful migration
        localStorage.removeItem('vlibras_config');
        console.log('VLibras config migrated from localStorage to database');
      }
      
      return { success: !error, error };
    } catch (error) {
      console.error('Error migrating localStorage to database:', error);
      return { success: false, error };
    }
  }
}

export const userSettingsService = new UserSettingsService();
