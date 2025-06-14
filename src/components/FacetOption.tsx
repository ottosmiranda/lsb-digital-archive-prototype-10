
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface FacetOptionProps {
  id: string;
  name: string;
  count: number;
  maxCount: number;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const FacetOption = React.memo(({ 
  id, 
  name, 
  count, 
  maxCount, 
  checked, 
  onCheckedChange 
}: FacetOptionProps) => {
  const percentage = Math.round((count / maxCount) * 100);
  
  return (
    <div className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="shrink-0"
      />
      <div className="flex-1 min-w-0">
        <Label 
          htmlFor={id} 
          className="text-sm cursor-pointer font-medium text-gray-800 group-hover:text-gray-900 block truncate"
        >
          {name}
        </Label>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-lsb-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <Badge 
            variant="secondary" 
            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 group-hover:bg-gray-200"
          >
            {count}
          </Badge>
        </div>
      </div>
    </div>
  );
});

FacetOption.displayName = 'FacetOption';

export default FacetOption;
