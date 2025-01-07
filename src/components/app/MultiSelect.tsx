// MultiSelect.tsx

import React, { useState, useCallback } from 'react';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  onCreateNew?: () => void;
  maxSelections?: number;
  disabled?: boolean;
  error?: string;
}

export function MultiSelect({ 
  options, 
  selected, 
  onChange, 
  onCreateNew, 
  maxSelections, 
  disabled = false,
  error 
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selectedItems = options.filter((option) => selected.includes(option.value));

  const handleSelect = useCallback((value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      if (maxSelections && selected.length >= maxSelections) {
        return;
      }
      onChange([...selected, value]);
    }
  }, [selected, onChange, maxSelections]);

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            role="combobox" 
            aria-expanded={open}
            aria-invalid={!!error}
            disabled={disabled}
            className={`w-[200px] justify-between ${error ? 'border-red-500' : ''}`}
          >
            <span className="truncate">
              {selectedItems.length > 0
                ? `${selectedItems.length} selected`
                : "Select labels..."}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search labels..." 
              aria-label="Search labels"
            />
            <CommandEmpty>
              <div className="p-2 text-sm text-muted-foreground">
                No label found.
                {onCreateNew && (
                  <Button
                    variant="ghost"
                    className="mt-2 w-full justify-start text-primary"
                    onClick={() => {
                      onCreateNew();
                      setOpen(false);
                    }}
                  >
                    + Create new label
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option.value)}
                  disabled={maxSelections ? selected.length >= maxSelections && !selected.includes(option.value) : false}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selected.includes(option.value) ? "opacity-100" : "opacity-0"
                    }`}
                    aria-hidden="true"
                  />
                  {option.label}
                  {maxSelections && selected.length >= maxSelections && !selected.includes(option.value) && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      (Max {maxSelections})
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

