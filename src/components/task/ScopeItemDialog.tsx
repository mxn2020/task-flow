// components/app/ScopeItemDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ColorPicker } from '@/components/app/ColorPicker';
import { Check, ChevronsUpDown, Plus, Pen, Tag, X, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useTemplates } from '@/contexts/TemplateContext';
import { BaseItem } from '@/types/ui';
import { SystemScopeType, Template, TemplateItem, TodoStatus, TodoVisibilityLevel } from '@/types';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { DateTimePicker } from '../ui/date-time-picker';
import { Switch } from '../ui/switch';
import { useScope } from '@/contexts/ScopeContext';
import { BaseScopeFormItem, ScopeItem } from '@/types/scopes_2';
import { ResponsiveDialog } from '@/components/app/ResponsiveDialog';


interface ScopeItemDialogProps<T extends BaseItem> {
  scopeType: SystemScopeType | string;
  item: T | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
  onClose?: () => void;
  onCreate?: (data: Partial<ScopeItem>) => Promise<void>;
  setShowArchiveDialog?: (show: boolean) => void;
  setShowRestoreDialog?: (show: boolean) => void;
  setShowDeleteDialog?: (show: boolean) => void;
}

export function ScopeItemDialog<T extends BaseItem>({
  scopeType,
  item,
  isOpen,
  onOpenChange,
  parentId,
  onClose,
  onCreate,
  setShowArchiveDialog,
  setShowRestoreDialog,
  setShowDeleteDialog,
}: ScopeItemDialogProps<T>) {
  const {
    items,
    types,
    categories,
    labels,
    selectedColor,
    setSelectedColor,
    createItem,
    createFromTemplate,
    updateItem,
    archiveItem,
    restoreItem
  } = useScope();

  const { templates, expandTemplate, fetchTemplates } = useTemplates();

  const [title, setTitle] = useState(item?.title || '');
  const [selectedType, setSelectedType] = useState(item?.typeId || '');
  const [selectedCategory, setSelectedCategory] = useState(item?.categoryId || '');
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    item?.labels?.map(l => l.id) || []
  );
  const [selectedParentId, setSelectedParentId] = useState<string | null>(
    parentId || item?.parentId || null
  );
  const [notes, setNotes] = useState(item?.notes || '');
  const [deadline, setDeadline] = useState<Date | undefined>(
    item?.deadline ? new Date(item.deadline) : undefined
  );
  const [isUrgent, setIsUrgent] = useState(item?.isUrgent || false);
  const [isFavorite, setIsFavorite] = useState(item?.isFavorite || false);
  const [status, setStatus] = useState<TodoStatus>(item?.status || 'not_started');
  const [visibilityLevel, setVisibilityLevel] = useState(
    item?.visibilityLevel || 'private'
  );

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [expandedTemplateItems, setExpandedTemplateItems] = useState<TemplateItem[]>([]);
  const [showTemplateExpansion, setShowTemplateExpansion] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setTitle(item.title);
      setSelectedType(item.typeId || '');
      setSelectedCategory(item.categoryId || '');
      setSelectedLabels(item.labels?.map(l => l.id) || []);
      setSelectedColor(item.colorDisplay || '');
      setSelectedParentId(item.parentId || null);
      setNotes(item.notes || '');
      setDeadline(item.deadline ? new Date(item.deadline) : undefined);
      setIsUrgent(item.isUrgent || false);
      setIsFavorite(item.isFavorite || false);
      setStatus(item.status || 'not_started');
      setVisibilityLevel(item.visibilityLevel || 'private');
    } else if (isOpen && !item) {
      setSelectedParentId(parentId || null);
    }
  }, [isOpen, item, setSelectedColor, parentId]);

  useEffect(() => {
    fetchTemplates(scopeType);
  }, [fetchTemplates, scopeType]);

  const handleSave = async () => {
    const itemData = {
      title: title || '',
      typeId: selectedType === 'all' ? null : selectedType,
      categoryId: selectedCategory === 'all' ? null : selectedCategory,
      colorDisplay: selectedColor,
      labels: labels.filter(l => selectedLabels.includes(l.id)),
      parentId: selectedParentId,
      notes: notes || '',
      deadline: deadline?.toISOString(),
      isUrgent,
      isFavorite,
      status,
      visibilityLevel
    };

    if (item) {
      await updateItem(item.id, itemData);
    } else if (selectedTemplate && expandedTemplateItems.length > 0) {
      await createFromTemplate(itemData, expandedTemplateItems);
    } else if (onCreate) {
      await onCreate(itemData as Partial<ScopeItem>);
    } else {
      await createItem(itemData);
    }

    handleClose();
  };

  const handleClose = () => {
    setTitle('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedLabels([]);
    setSelectedParentId(null);
    setNotes('');
    setDeadline(undefined);
    setIsUrgent(false);
    setIsFavorite(false);
    setStatus('not_started');
    setVisibilityLevel('private');
    setSelectedTemplate(null);
    setExpandedTemplateItems([]);
    setShowTemplateExpansion(false);
    if (onClose) onClose();
    onOpenChange(false);
  };

  const handleSelectTemplate = async (template: Template) => {
    setSelectedTemplate(template);
    if (template.id) {
      const items = await expandTemplate(template.id);
      setExpandedTemplateItems(items);
      setShowTemplateExpansion(true);
    } else {
      setExpandedTemplateItems([]);
      setShowTemplateExpansion(false);
    }
  };

  const renderTemplateItem = (item: TemplateItem, level: number = 0) => (
    <div key={item.id} className="space-y-2">
      <div
        className="flex items-center gap-2 group"
        style={{ marginLeft: `${level * 1.5}rem` }}
      >
        <Input
          value={item.title}
          onChange={(e) => item.id && handleUpdateTemplateItem(item.id, e.target.value)}
          className="flex-1"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => item.id && handleAddChildItem(item.id)}
          className="h-8 w-8 opacity-0 group-hover:opacity-100"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => item.id && handleRemoveTemplateItem(item.id)}
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {item.children?.length > 0 && (
        <div className="space-y-2">
          {item.children.map(child => renderTemplateItem(child, level + 1))}
        </div>
      )}
    </div>
  );

  const handleUpdateTemplateItem = (itemId: string, title: string) => {
    setExpandedTemplateItems(prev => updateItemInTree(prev, itemId, title));
  };

  const handleAddChildItem = (parentId: string) => {
    const newItem: TemplateItem = {
      id: crypto.randomUUID(),
      title: "New Item",
      children: []
    };
    setExpandedTemplateItems(prev => addChildToItem(prev, parentId, newItem));
  };

  const handleRemoveTemplateItem = (itemId: string) => {
    setExpandedTemplateItems(prev => removeItemFromTree(prev, itemId));
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

  const handleStatusChange = (value: string) => {
    setStatus(value as TodoStatus);
  };

  const handleVisibilityChange = (value: string) => {
    setVisibilityLevel(value as TodoVisibilityLevel);
  }

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={item ? `Edit ${scopeType}` : `New ${scopeType}`}
      onSave={handleSave}
      onCancel={handleClose}
      showDelete={!!setShowDeleteDialog && !!item}
      showArchive={!!setShowArchiveDialog && !!item}
      onDelete={async () => { setShowDeleteDialog?.(true) }}
      onArchive={async () => { setShowArchiveDialog?.(true) }}
      onRestore={async () => { setShowRestoreDialog?.(true) }}
     isArchived={!!item?.archivedAt}
    >
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`${scopeType} title`}
            className="flex-grow"
          />
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </div>

        {selectedParentId && (
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
              Parent: {items.find(t => t.id === selectedParentId)?.title}
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={() => setSelectedParentId(null)}
              />
            </Badge>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">No type</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: type.color }}
                        />
                        {type.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>

              <Select value={visibilityLevel} onValueChange={handleVisibilityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm">Is Urgent</span>
                <Switch
                  checked={isUrgent}
                  onCheckedChange={setIsUrgent}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Is Favorite</span>
                <Switch
                  checked={isFavorite}
                  onCheckedChange={setIsFavorite}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Labels</h4>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <Badge
                      key={label.id}
                      variant={selectedLabels.includes(label.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedLabels.includes(label.id) ? label.color : 'transparent',
                        borderColor: label.color,
                        color: selectedLabels.includes(label.id) ? 'white' : label.color
                      }}
                      onClick={() => {
                        setSelectedLabels(prev =>
                          prev.includes(label.id)
                            ? prev.filter(id => id !== label.id)
                            : [...prev, label.id]
                        );
                      }}
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Deadline</h4>
                <DateTimePicker
                  date={deadline}
                  setDate={setDeadline}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Notes</h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes..."
                  className="h-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {!item && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Popover open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedTemplate?.title || "Select template"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search templates..." />
                  <CommandEmpty>No templates found.</CommandEmpty>
                  <CommandGroup>
                    <ScrollArea className="h-[200px]">
                      <CommandItem
                        onSelect={() => {
                          setSelectedTemplate(null);
                          setShowTemplateExpansion(false);
                          setTemplateDialogOpen(false);
                        }}
                        className="justify-between"
                      >
                        No template
                        {!selectedTemplate && <Check className="h-4 w-4" />}
                      </CommandItem>
                      {templates.map((template) => (
                        <CommandItem
                          key={template.id}
                          onSelect={() => {
                            handleSelectTemplate(template);
                            setTemplateDialogOpen(false);
                          }}
                          className="justify-between"
                        >
                          {template.title}
                          {selectedTemplate?.id === template.id && (
                            <Check className="h-4 w-4" />
                          )}
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

            {showTemplateExpansion && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Template Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-4">
                      {expandedTemplateItems.map((item) => renderTemplateItem(item))}

                      <Button
                        variant="outline"
                        className="w-full border-dashed flex items-center gap-2"
                        onClick={() => {
                          const newItem = {
                            id: crypto.randomUUID(),
                            title: "New Item",
                            children: []
                          };
                          setExpandedTemplateItems([...expandedTemplateItems, newItem]);
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add Root Item
                      </Button>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}