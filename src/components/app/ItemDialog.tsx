// components/app/ItemDialog.tsx

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from '@/components/app/ColorPicker';
import { Group, Type, Category, Label } from '@/types';

type ItemType = Group | Type | Category | Label;

interface ItemDialogProps {
  item?: ItemType;
  type: 'group' | 'type' | 'category' | 'label';
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<ItemType>) => Promise<void>;
}

export function ItemDialog({
  item,
  type,
  isOpen,
  onClose,
  onSave
}: ItemDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3498db');
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setName(item.name);
      if ('color' in item) {
        setColor(item.color);
      }
    } else {
      setName('');
      setColor('#3498db');
    }
  }, [item]);

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      const itemData: Partial<ItemType> = {
        name: name.trim(),
        ...(type !== 'group' && { color })
      };

      await onSave(itemData);
      setError('');
      onClose();
    } catch (e) {
      setError('Error saving item');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? `Edit ${type}` : `New ${type}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4 items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${type} name`}
              className="flex-grow"
            />
            {type !== 'group' && (
              <ColorPicker
                selectedColor={color}
                onColorSelect={setColor}
              />
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}