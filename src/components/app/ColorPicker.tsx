import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';

const COLORS = [
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

const NoColorPattern = () => (
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
  className,
}: ColorPickerProps) {
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  const renderColorButton = (color: string) => {
    if (color === 'none') {
      return <NoColorPattern />;
    }
    return <div className="w-full h-full" style={{ backgroundColor: color }} />;
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowColorPicker(!showColorPicker)}
        className="flex items-center gap-2"
      >
        <div className="w-4 h-4 rounded-full border border-gray-300 overflow-hidden">
          {renderColorButton(selectedColor)}
        </div>
        <Paintbrush size={16} />
      </Button>

      {showColorPicker && (
        <div className="absolute mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="grid grid-cols-4 gap-2 w-48">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className="w-10 h-10 rounded-lg hover:scale-110 transition-transform duration-200 ease-in-out shadow-lg overflow-hidden"
                onClick={() => {
                  onColorSelect(color.value);
                  setShowColorPicker(false)
                }}
                title={color.name}
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
