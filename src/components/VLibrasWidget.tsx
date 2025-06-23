
import { useVLibrasWidget } from '@/hooks/useVLibrasWidget';

const VLibrasWidget = () => {
  // Use the hook - this handles all VLibras logic following SRP
  useVLibrasWidget();

  // Component is purely for lifecycle management - no UI needed
  return null;
};

export default VLibrasWidget;
