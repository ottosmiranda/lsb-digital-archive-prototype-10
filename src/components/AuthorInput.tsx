
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchResult } from '@/types/searchTypes';
import AuthorSuggestions from '@/components/AuthorSuggestions';

interface AuthorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentResults?: SearchResult[];
}

const AuthorInput = React.memo(({ value, onChange, placeholder = "Nome do autor", currentResults = [] }: AuthorInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const shouldMaintainFocus = useRef(false);
  const isMobile = useRef(false);

  // Detect mobile device
  useEffect(() => {
    isMobile.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

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

  // Enhanced focus management for mobile
  useEffect(() => {
    if (shouldMaintainFocus.current && inputRef.current) {
      const restoreFocus = () => {
        if (inputRef.current && document.activeElement !== inputRef.current) {
          if (isMobile.current) {
            // For mobile, use a slight delay to ensure the keyboard stays open
            setTimeout(() => {
              inputRef.current?.focus();
            }, 10);
          } else {
            inputRef.current.focus();
          }
        }
        shouldMaintainFocus.current = false;
      };

      if (isMobile.current) {
        // Use requestAnimationFrame for mobile to ensure proper timing
        requestAnimationFrame(restoreFocus);
      } else {
        restoreFocus();
      }
    }
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    shouldMaintainFocus.current = true;
    setLocalValue(newValue);
    
    // Show suggestions if 3 or more characters
    setShowSuggestions(newValue.length >= 3);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  const handleSuggestionSelect = useCallback((authorName: string) => {
    setLocalValue(authorName);
    onChange(authorName);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    if (localValue.length >= 3) {
      setShowSuggestions(true);
    }
  }, [localValue]);

  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="pr-10"
        autoComplete="off"
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
      {showSuggestions && localValue.length >= 3 && (
        <AuthorSuggestions
          query={localValue}
          currentResults={currentResults}
          onSelect={handleSuggestionSelect}
        />
      )}
    </div>
  );
});

AuthorInput.displayName = 'AuthorInput';

export default AuthorInput;
