// MultiSelect.tsx
import React, { useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Option = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  onCreateNew?: () => void;
};

export function MultiSelect({ options, selected, onChange, onCreateNew }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedItems = options.filter((option) => selected.includes(option.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[200px] justify-between">
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : "Select labels..."}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search labels..." />
          <CommandEmpty>
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
          </CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                onSelect={() => {
                  onChange(
                    selected.includes(option.value)
                      ? selected.filter((item) => item !== option.value)
                      : [...selected, option.value]
                  );
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  }`}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}