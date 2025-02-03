// components/apps/ScopeDialog.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Scope } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from '@/components/app/ColorPicker';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { IconPicker } from '@/components/app/IconPicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { IconName } from '@/types/icons';
import { generateSlug } from '@/utils/slugify';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';
import { FieldType } from '@/utils/validation';

interface Field {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  position: number;
  error?: string;
}

interface ScopeDialogProps {
  scope?: Scope | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (scope: Partial<Scope>) => Promise<void>;
}

const fieldTypes: FieldType[] = [
  'string',
  'number',
  'boolean',
  'date',
  'array',
  'select',
  'text',
  'object'
];

export function ScopeDialog({
  scope,
  isOpen,
  onClose,
  onSave,
}: ScopeDialogProps) {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [color, setColor] = useState('#3498db');
  const [icon, setIcon] = useState('');
  const [showInSidebar, setShowInSidebar] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  const [error, setError] = useState('');
  const [allowNesting, setAllowNesting] = useState(false);

  const resetForm = useCallback(() => {
    if (scope) {
      setName(scope.name);
      setSlug(scope.slug);
      setColor(scope.color || '#3498db');
      setIcon(scope.icon || '');
      setAllowNesting(scope.allowNesting ?? false);
      setShowInSidebar(scope.showInSidebar ?? true);
      const fieldArray = Object.entries(scope.metadata.fields).map(([name, field], index) => ({
        id: crypto.randomUUID(),
        name,
        type: field.type as FieldType,
        required: field.required || false,
        position: field.position || index,
        error: ''
      }));
      setFields(fieldArray.sort((a, b) => a.position - b.position));
    } else {
      setName('');
      setSlug('');
      setColor('#3498db');
      setIcon('');
      setAllowNesting(false);
      setShowInSidebar(true);
      setFields([]);
    }
    setError('');
  }, [scope]);

  useEffect(() => {
    resetForm();
  }, [resetForm, isOpen]);

  useEffect(() => {
    return () => {
      resetForm();
    };
  }, [resetForm]);

  useEffect(() => {
    if (!scope) {
      setSlug(generateSlug(name));
    }
  }, [name, scope]);

  if (!session?.user?.email) {
    return <div>Unauthorized</div>;
  }

  const userId = session.user.id;

  const validateFields = () => {
    let hasErrors = false;
    const newFields = fields.map(field => {
      const duplicateNames = fields.filter(f =>
        f.id !== field.id && f.name.trim().toLowerCase() === field.name.trim().toLowerCase()
      );

      const fieldErrors = [];
      if (!field.name.trim()) {
        fieldErrors.push('Field name is required');
      }
      if (duplicateNames.length > 0) {
        fieldErrors.push('Field name must be unique');
      }

      const error = fieldErrors.join(', ');
      if (error) hasErrors = true;

      return { ...field, error };
    });

    setFields(newFields);
    return !hasErrors;
  };


  const handleAddField = () => {
    setFields([...fields, {
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      position: fields.length,
      required: false,
      error: ''
    }]);
  };

  const handleFieldChange = (id: string, field: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...field, error: '' } : f));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedFields = items.map((field, index) => ({
      ...field,
      position: index
    }));

    setFields(reorderedFields);
  };

  const handleSave = async () => {
    try {
      // Validate name
      if (!name.trim()) {
        setError('Name is required');
        return;
      }

      // Validate fields
      if (!validateFields()) {
        setError('Please fix field errors before saving');
        return;
      }

      // Check for existing slug
      const scopeQuery = supabase
        .from('scopes')
        .select('id')
        .eq('slug', slug)
        .eq('user_id', userId);

      // Only add neq condition if editing existing scope
      if (scope?.id) {
        scopeQuery.neq('id', scope.id);
      }

      const { data: existingScopes, error: slugError } = await scopeQuery;

      if (slugError) {
        throw slugError;
      }

      if (existingScopes && existingScopes.length > 0) {
        setError('A scope with this slug already exists');
        return;
      }

      // Prepare metadata
      const metadata = {
        fields: Object.fromEntries(
          fields.map(field => [
            field.name,
            {
              type: field.type,
              required: field.required
            }
          ])
        )
      };

      // Save scope
      await onSave({
        name: name.trim(),
        slug,
        color,
        icon,
        showInSidebar,
        allowNesting,
        metadata
      });

      setError('');
      onClose();
    } catch (e) {
      setError('Error saving scope');
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" aria-label={scope ? 'Edit Scope' : 'New Scope'}>
        <DialogHeader>
          <DialogTitle>{scope ? 'Edit Scope' : 'New Scope'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex gap-4 items-center">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Scope name"
              className="flex-grow"
            />
            <Input
              value={slug}
              readOnly
              placeholder="Scope slug"
              className="cursor-not-allowed"
              disabled
            />
            <div className="flex gap-2">
              <ColorPicker
                selectedColor={color}
                onColorSelect={setColor}
              />
              <IconPicker
                selectedIcon={icon as IconName}
                onIconSelect={setIcon}
                className="w-[140px]"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Show in sidebar toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={showInSidebar}
                onCheckedChange={setShowInSidebar}
              />
              <Label>Show in Sidebar</Label>
            </div>

            {/* Allow nesting toggle */}
            <div className="flex items-center gap-2">
              <Switch
                checked={allowNesting}
                onCheckedChange={setAllowNesting}
              />
              <Label>Allow Nesting</Label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Fields</h3>
              <Button onClick={handleAddField} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-4 ${snapshot.isDragging ? 'ring-2 ring-primary shadow-lg' : ''}`}
                              style={{
                                ...provided.draggableProps.style,
                                left: 'auto !important',
                                top: 'auto !important'
                              }}
                            >
                              <div className="flex items-start gap-4">

                                <div className="mt-3 cursor-grab active:cursor-grabbing hover:cursor-grab">
                                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                                </div>

                                <div className="flex-grow space-y-4">
                                  <div className="flex gap-4">
                                    <div className="flex-grow">
                                      <Input
                                        value={field.name}
                                        onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                                        placeholder="Field name"
                                        className={field.error ? 'border-red-500' : ''}
                                      />
                                      {field.error && (
                                        <p className="text-sm text-red-500 mt-1">{field.error}</p>
                                      )}
                                    </div>
                                    <Select
                                      value={field.type}
                                      onValueChange={(value: FieldType) => handleFieldChange(field.id, { type: value })}
                                    >
                                      <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fieldTypes.map(type => (
                                          <SelectItem key={type} value={type}>
                                            {type}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={field.required}
                                      onCheckedChange={(checked) => handleFieldChange(field.id, { required: checked })}
                                    />
                                    <Label>Required</Label>
                                  </div>
                                </div>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveField(field.id)}
                                  className="h-9 w-9"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </ScrollArea>
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