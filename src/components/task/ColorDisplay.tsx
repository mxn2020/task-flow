// components/ColorDisplay.tsx

import { SystemScopeType } from '@/types';

interface ColorDisplayProps {
  color?: string;
  display: 'none' | 'vertical' | 'background';
  className?: string;
  objectType?: string;
  scopeType?: SystemScopeType | string;
}

export function ColorDisplay({ color, display, objectType, scopeType }: ColorDisplayProps) {
  if (!color || display === 'none') return null;

  if (display === 'vertical') {
    const height = objectType === 'template' 
      ? 'h-12'
      : scopeType === 'todo' 
        ? 'h-10' 
        : scopeType === 'brainstorm' 
          ? 'h-20' 
          : 'h-10';

    return (
      <div 
        className={`w-2 rounded-sm ${height}`}
        style={{ backgroundColor: color || 'transparent' }}
      />
    );
  }

  if (display === 'background') {
    const radius = objectType === 'template' ? '1rem' : '0.7rem';
    const opacity = objectType === 'template' ? '0.15' : '0.10';

    return (
      <div
        className="absolute inset-0"
        style={{ 
          backgroundColor: color,
          borderRadius: radius,
          opacity
        }}
      />
    );
  }

  return null;
}