
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AuthorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const AuthorInput = React.memo(({ value, onChange, placeholder = "Nome do autor" }: AuthorInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const shouldMaintainFocus = useRef(false);

  // Sync external value changes (like clearing filters)
  useEffect(() => {
    if (value !== localValue) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounced onChange to parent
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, 650);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [localValue, value, onChange]);

  // Focus management
  useEffect(() => {
    if (shouldMaintainFocus.current && inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus();
      shouldMaintainFocus.current = false;
    }
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    shouldMaintainFocus.current = true;
    setLocalValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        className="pr-10"
      />
      {localValue && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
          onClick={handleClear}
        >
          <X className="h-4 w-4 text-gray-500" />
        </Button>
      )}
    </div>
  );
});

AuthorInput.displayName = 'AuthorInput';

export default AuthorInput;
