
import { useEffect } from 'react';

const ElfsightAccessibilityWidget = () => {
  useEffect(() => {
    // Check if script is already loaded to avoid duplicates
    const existingScript = document.querySelector('script[src="https://static.elfsight.com/platform/platform.js"]');
    
    if (!existingScript) {
      console.log('🔧 Loading Elfsight Accessibility Widget...');
      
      const script = document.createElement('script');
      script.src = 'https://static.elfsight.com/platform/platform.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ Elfsight Accessibility Widget loaded successfully');
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load Elfsight Accessibility Widget:', error);
      };
      
      document.head.appendChild(script);
    } else {
      console.log('✅ Elfsight script already loaded');
    }
  }, []);

  return (
    <div 
      className="elfsight-app-c2433c27-3c13-4590-8922-e4a2560e739d" 
      data-elfsight-app-lazy
    />
  );
};

export default ElfsightAccessibilityWidget;
