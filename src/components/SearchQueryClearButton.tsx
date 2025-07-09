
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchQueryClearButtonProps {
  onClear: () => void;
  className?: string;
}

const SearchQueryClearButton = ({ onClear, className = "" }: SearchQueryClearButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClear}
      className={`ml-2 h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${className}`}
      title="Limpar busca"
    >
      <X className="h-4 w-4" />
    </Button>
  );
};

export default SearchQueryClearButton;
