
import React, { useEffect } from 'react';
import { useVLibras } from '@/contexts/VLibrasContext';

const VLibrasWidget: React.FC = () => {
  const { state } = useVLibras();

  useEffect(() => {
    // Widget initialization is handled by the context/service
    // This component is purely for lifecycle management
  }, []);

  // This component doesn't render any UI itself
  // The VLibras widget is injected directly into the DOM by the service
  return null;
};

export default VLibrasWidget;
