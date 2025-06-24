
import React, { useEffect } from 'react';
import { useVLibras } from '@/contexts/VLibrasContext';

const VLibrasWidget: React.FC = () => {
  const { state } = useVLibras();

  useEffect(() => {
    console.log('VLibrasWidget: Component mounted, current state:', {
      isLoaded: state.isLoaded,
      isEnabled: state.isEnabled,
      error: state.error
    });
  }, [state]);

  // This component doesn't render any UI itself
  // The VLibras widget is already in the HTML and managed by the service
  return null;
};

export default VLibrasWidget;
