
import { useEffect } from 'react';
import { vlibrasService } from '@/services/vlibrasService';

export const useVLibrasWidget = () => {
  useEffect(() => {
    // Initialize VLibras service
    vlibrasService.init();

    // Listen for storage changes
    const handleStorageChange = () => {
      const savedEnabled = localStorage.getItem('vlibras-enabled');
      if (savedEnabled !== null) {
        const enabled = JSON.parse(savedEnabled);
        vlibrasService.setEnabled(enabled);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    setEnabled: (enabled: boolean) => vlibrasService.setEnabled(enabled),
    isEnabled: () => vlibrasService.isVLibrasEnabled()
  };
};
