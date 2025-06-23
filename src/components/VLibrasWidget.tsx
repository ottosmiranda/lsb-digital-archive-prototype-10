
import { useEffect, useState } from 'react';
import { Accessibility } from 'lucide-react';

declare global {
  interface Window {
    VLibras: {
      Widget: new (url: string) => void;
    };
  }
}

const VLibrasWidget = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Load settings from localStorage
    const savedEnabled = localStorage.getItem('vlibras-enabled');
    if (savedEnabled !== null) {
      setIsEnabled(JSON.parse(savedEnabled));
    }
  }, []);

  useEffect(() => {
    // Check if VLibras is already loaded
    if (window.VLibras) {
      setIsLoaded(true);
      return;
    }

    // Listen for VLibras script load
    const checkVLibras = () => {
      if (window.VLibras) {
        setIsLoaded(true);
      } else {
        setTimeout(checkVLibras, 100);
      }
    };

    checkVLibras();
  }, []);

  useEffect(() => {
    // Control widget visibility based on settings
    const vwElement = document.querySelector('[vw]') as HTMLElement;
    if (vwElement) {
      vwElement.style.display = isEnabled ? 'block' : 'none';
    }
  }, [isEnabled]);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedEnabled = localStorage.getItem('vlibras-enabled');
      if (savedEnabled !== null) {
        setIsEnabled(JSON.parse(savedEnabled));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Only show status indicator, let VLibras handle its own UI
  if (!isEnabled || !isLoaded) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 pointer-events-none">
      {/* Status indicator only */}
      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border">
        <Accessibility className="h-4 w-4 text-lsb-primary" />
        <span className="text-xs text-gray-700 font-medium">VLibras Ativo</span>
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      </div>
    </div>
  );
};

export default VLibrasWidget;
