
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterLoadingButtonProps {
  children: React.ReactNode;
  isActive?: boolean;
  isLoading?: boolean;
  count?: number;
  onClick?: () => void;
  className?: string;
}

const FilterLoadingButton = ({ 
  children, 
  isActive = false, 
  isLoading = false,
  count,
  onClick,
  className 
}: FilterLoadingButtonProps) => {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "relative flex items-center gap-2 transition-all duration-200",
        isActive && "bg-lsb-primary hover:bg-lsb-primary/90 text-white",
        isLoading && "opacity-70",
        className
      )}
    >
      {isLoading && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      
      {children}
      
      {count !== undefined && count > 0 && (
        <Badge 
          variant="secondary" 
          className={cn(
            "text-xs ml-1",
            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-700"
          )}
        >
          {count}
        </Badge>
      )}
    </Button>
  );
};

export default FilterLoadingButton;
