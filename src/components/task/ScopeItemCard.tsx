// components/app/ScopeItemCard.tsx

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BaseCard } from './BaseCard';
import { Category, Label, ObjectType, SystemScopeType, Type } from '@/types';
import { BaseItem } from '@/types/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tag, X, Check, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScopeItemDialog } from './ScopeItemDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  ArchiveConfirmationDialog, 
  RestoreConfirmationDialog, 
  DeleteConfirmationDialog 
} from '@/components/app/ConfirmationDialog';
import { useScope } from '@/contexts/ScopeContext';

interface ScopeItemCardProps<T extends BaseItem> {
  item: T;
  scopeType: SystemScopeType | string;
  objectType: ObjectType;
  labels: Label[];
  types: Type[];
  categories: Category[];
  hasChildren: boolean;
  isExpanded: boolean;
  allowNesting: boolean;
  colorDisplay: 'none' | 'vertical' | 'background';
  onToggleExpand: () => void;
  onAddChild: () => void;
  onArchive: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: Partial<T>) => Promise<T>;
  showActions?: boolean;
  showLabels?: boolean;
}

export function ScopeItemCard<T extends BaseItem>({
  item,
  scopeType,
  labels,
  types,
  categories,
  hasChildren,
  isExpanded,
  allowNesting,
  colorDisplay,
  onToggleExpand,
  onAddChild,
  onArchive,
  onDelete,
  onUpdate,
  showActions = true,
  showLabels = true
}: ScopeItemCardProps<T>) {
  const { updateItem, archiveItem, restoreItem, softDeleteItem } = useScope();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(item.title);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('button')
      ) {
        if (hasChanges) {
          setShowSaveDialog(true);
        } else {
          setIsEditing(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, hasChanges]);

  useEffect(() => {
    setContent(item.title);
  }, [item.title]);

  const handleSave = async () => {
    if (content !== item.title) {
      setIsEditing(false);
      setHasChanges(false);
      setShowSaveDialog(false);
      try {
        await updateItem(item.id, { title: content });
      } catch (error) {
        setContent(item.title);
        console.error('Failed to update:', error);
      }
    }
  };

  const handleCancel = () => {
    setContent(item.title);
    setIsEditing(false);
    setHasChanges(false);
    setShowSaveDialog(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
    setHasChanges(e.target.value !== item.title);
  };

  const renderLabels = (item: T) => {
    if (!showLabels || !item.labels?.length) return null;

    return (
      <div className="flex flex-wrap mt-1 hidden md:block">
        {item.labels.map(label => (
          <Badge
            key={label.id}
            variant="default"
            className="text-xs mr-1"
            style={{
              backgroundColor: label.color,
              color: getContrastText(label.color)
            }}
          >
            <Tag className="w-3 h-3 mr-1" />
            {label.name}
          </Badge>
        ))}
      </div>
    );
  };

  const getContrastText = (bgColor: string) => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  const renderContent = () => (
    <div
      className="w-full flex items-center gap-2"
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          setIsEditing(true);
        }
      }}
    >
      <Input
        ref={isEditing ? inputRef : null}
        value={content}
        onChange={isEditing ? handleContentChange : undefined}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        className={cn(
          "resize-none flex-1 border-0 shadow-none hover:ring",
          item.completedAt != null && "line-through text-muted-foreground",
          isEditing && hasChanges ? "border-red-500" : isEditing && "border-green-500"
        )}
        readOnly={!isEditing}
        autoFocus={isEditing}
        onClick={(e) => isEditing && e.stopPropagation()}
      />
      {!isEditing ? renderLabels(item) : null}
      {isEditing && (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChanges) {
                setShowSaveDialog(true);
              } else {
                handleCancel();
              }
            }}
            className="p-1 hover:bg-red-100 hover:text-red-600"
          >
            <X size={16} className="text-red-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            className="p-1 hover:bg-green-100 hover:text-green-600"
          >
            <Check size={16} className="text-green-500" />
          </Button>
        </div>
      )}
    </div>
  );

  const renderTodoActions = (item: T) => (
    !item.archivedAt && (
      <Button
        variant="ghost" 
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          updateItem(item.id, { completedAt: item.completedAt != null ? null : new Date().toISOString() });
        }}
        className="text-muted-foreground hover:text-foreground p-1 hover:bg-primary/20"
      >
        {item.completedAt != null ?
          <CheckSquare size={24} className="text-primary" /> :
          <Square size={24} />
        }
      </Button>
    )
  );

  return (
    <>
      <BaseCard
        scopeItem={item}
        objectType="scope"
        scopeType={scopeType}
        hasChildren={hasChildren}
        isExpanded={isExpanded}
        allowNesting={allowNesting}
        colorDisplay={colorDisplay}
        onToggleExpand={onToggleExpand}
        onAddChild={onAddChild}
        onDelete={() => setShowDeleteDialog(true)}
        onArchive={() => setShowArchiveDialog(true)}
        onRestore={() => setShowRestoreDialog(true)}
        onClick={() => setIsDialogOpen(true)}
        onEditClick={() => setIsDialogOpen(true)}
        renderContent={renderContent}
        renderActions={showActions ? renderTodoActions : undefined}
      />

      <ScopeItemDialog
        scopeType={scopeType}
        item={item}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        setShowArchiveDialog={setShowArchiveDialog}
        setShowRestoreDialog={setShowRestoreDialog}
        setShowDeleteDialog={setShowDeleteDialog}
      />

      {/* Updated Confirmation Dialogs with async onConfirm */}
      <ArchiveConfirmationDialog
        type={scopeType}
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        onConfirm={async () => {
          // The dialog handles closing after a successful promise
          await archiveItem(item.id);
        }}
        title={item.title}
      />

      <RestoreConfirmationDialog
        type={scopeType}
        open={showRestoreDialog}
        onOpenChange={setShowRestoreDialog}
        onConfirm={async () => {
          await restoreItem(item.id);
        }}
        title={item.title}
      />

      <DeleteConfirmationDialog
        type={scopeType}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={async () => {
          await softDeleteItem(item.id);
        }}
        title={item.title}
      />

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to save the changes to this {scopeType}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
