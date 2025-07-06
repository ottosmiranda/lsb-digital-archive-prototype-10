
import React, { useState, KeyboardEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';

interface PageJumpInputProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PageJumpInput = ({ currentPage, totalPages, onPageChange }: PageJumpInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const handleJumpToPage = () => {
    const pageNumber = parseInt(inputValue.trim());
    
    if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages) {
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 2000);
      return;
    }

    if (pageNumber !== currentPage) {
      onPageChange(pageNumber);
    }
    
    setInputValue('');
    setIsInvalid(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === '' || /^\d+$/.test(value)) {
      setInputValue(value);
      setIsInvalid(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="flex items-center gap-2 mx-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Ir para:
      </span>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          placeholder={`1-${totalPages}`}
          className={`w-20 h-8 text-center text-sm ${
            isInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''
          }`}
          title={`Digite um número entre 1 e ${totalPages}`}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleJumpToPage}
          className="h-8 w-8 p-0"
          disabled={!inputValue.trim()}
          title="Ir para página"
        >
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
      {isInvalid && (
        <span className="text-xs text-red-500 whitespace-nowrap">
          1-{totalPages}
        </span>
      )}
    </div>
  );
};

export default PageJumpInput;
