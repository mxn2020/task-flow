'use client';

import React, { useState, useEffect } from 'react';
import { Template, TemplateItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTemplates } from '@/contexts/TemplateContext';

interface TemplateEditModalProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (template: Template) => Promise<void>;
}

export function TemplateEditModal({
  template,
  isOpen,
  onClose,
  onUpdate
}: TemplateEditModalProps) {
  const { updateTemplate, expandTemplate } = useTemplates();
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState(template?.title || '');
  const [scopeType, setScopeType] = useState(template?.scopeType || 'todo');
  const [items, setItems] = useState<TemplateItem[]>([]);

  useEffect(() => {
    const loadTemplate = async () => {
      setIsLoading(true);
      setTitle(template?.title || '');
      setScopeType(template?.scopeType || 'todo');
      const expandedItems = await expandTemplate(template.id!);
      setItems(expandedItems);
      setIsLoading(false);
    };
    loadTemplate();
  }, [template, expandTemplate]);

  const handleSave = async () => {
    await updateTemplate(template.id!, {
      title,
      scopeType,
      items
    });
    onClose();
  };

  const handleUpdateItem = (itemId: string, title: string) => {
    setItems(prev => updateItemInTree(prev, itemId, title));
  };

  const handleAddItem = () => {
    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      title: "New Item",
      children: []
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleAddChildItem = (parentId: string) => {
    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      title: "New Item",
      children: []
    };
    setItems(prev => addChildToItem(prev, parentId, newItem));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => removeItemFromTree(prev, itemId));
  };

  const updateItemInTree = (items: TemplateItem[], itemId: string, title: string): TemplateItem[] => {
    return items.map(item => {
      if (item.id === itemId) {
        return { ...item, title };
      }
      if (item.children) {
        return { ...item, children: updateItemInTree(item.children, itemId, title) };
      }
      return item;
    });
  };

  const addChildToItem = (items: TemplateItem[], parentId: string, newItem: TemplateItem): TemplateItem[] => {
    return items.map(item => {
      if (item.id === parentId) {
        return { ...item, children: [...(item.children || []), newItem] };
      }
      if (item.children) {
        return { ...item, children: addChildToItem(item.children, parentId, newItem) };
      }
      return item;
    });
  };

  const removeItemFromTree = (items: TemplateItem[], itemId: string): TemplateItem[] => {
    return items
      .filter(item => item.id !== itemId)
      .map(item => ({
        ...item,
        children: item.children ? removeItemFromTree(item.children, itemId) : []
      }));
  };

  const renderItem = (item: TemplateItem, level: number = 0) => (
    <div key={item.id} className="space-y-2">
      <div 
        className="flex items-center gap-2 group" 
        style={{ marginLeft: `${level * 1.5}rem` }}
      >
        <Input
          value={item.title}
          onChange={(e) => handleUpdateItem(item.id!, e.target.value)}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleAddChildItem(item.id!)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveItem(item.id!)}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {item.children?.length > 0 && (
        <div className="space-y-2">
          {item.children.map(child => renderItem(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-4">
            <div className="flex-grow">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Template title"
              />
            </div>
            <Select value={scopeType} onValueChange={(value) => setScopeType(value as "todo" | "brainstorm")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Item type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="brainstorm">Brainstorm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center p-4">Loading...</div>
                  ) : (
                    items?.map((item) => renderItem(item))
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={handleAddItem}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}