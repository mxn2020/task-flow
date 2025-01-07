// components/app/ColorPicker.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';

interface Color {
  name: string;
  value: string;
}

const COLORS: Color[] = [
  { name: 'No Color', value: 'none' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Gray', value: '#6B7280' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#111827' },
];

const NoColorPattern: React.FC = () => (
  <div className="w-full h-full relative overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(-45deg, #111827 50%, #FFFFFF 50%)',
      }}
    />
  </div>
);

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  className?: string;
}

export function ColorPicker({
  selectedColor,
  onColorSelect,
  className = '',
}: ColorPickerProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, color: Color) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onColorSelect(color.value);
      setShowColorPicker(false);
    }
    if (e.key === 'Escape') {
      setShowColorPicker(false);
    }
  };

  const renderColorButton = (color: string) => {
    if (color === 'none') {
      return <NoColorPattern />;
    }
    return <div className="w-full h-full" style={{ backgroundColor: color }} />;
  };

  const selectedColorName = COLORS.find(c => c.value === selectedColor)?.name || 'Select Color';

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="flex items-center gap-2"
        aria-label={`Color picker - Current color: ${selectedColorName}`}
        aria-expanded={showColorPicker}
        aria-haspopup="true"
      >
        <div className="w-4 h-4 rounded-full border border-gray-300 overflow-hidden">
          {renderColorButton(selectedColor)}
        </div>
        <Paintbrush size={16} aria-hidden="true" />
      </Button>

      {showColorPicker && (
        <div 
          className="absolute mt-2 p-3 bg-background rounded-lg shadow-lg border border-input z-50"
          role="dialog"
          aria-label="Choose a color"
        >
          <div 
            className="grid grid-cols-4 gap-2 w-48"
            role="radiogroup"
            aria-label="Color options"
          >
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className="w-10 h-10 rounded-lg hover:scale-110 transition-transform duration-200 ease-in-out shadow-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => {
                  onColorSelect(color.value);
                  setShowColorPicker(false);
                }}
                onKeyDown={(e) => handleKeyDown(e, color)}
                title={color.name}
                role="radio"
                aria-checked={selectedColor === color.value}
                aria-label={color.name}
              >
                {renderColorButton(color.value)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}