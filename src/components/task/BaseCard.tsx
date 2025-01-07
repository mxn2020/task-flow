//components/app/BaseCard.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Archive, ChevronDown, ChevronRight, Pen, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColorDisplay } from '@/components/app/ColorDisplay';
import { BaseItem, BaseTemplateItem } from '@/types/ui';
import { ObjectType, SystemScopeType } from '@/types';

interface BaseCardProps<T extends BaseItem | BaseTemplateItem> {
  scopeItem: T;
  objectType: ObjectType;
  scopeType: SystemScopeType | string;
  hasChildren: boolean;
  isExpanded: boolean;
  colorDisplay: 'none' | 'vertical' | 'background';
  onToggleExpand: () => void;
  onAddChild: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onClick: () => void;
  onEditClick: () => void;
  renderContent: (scopeItem: T) => React.ReactNode;
  renderActions?: (scopeItem: T) => React.ReactNode;
}

export function BaseCard<T extends BaseItem | BaseTemplateItem>({
  scopeItem,
  objectType,
  scopeType,
  hasChildren,
  isExpanded,
  colorDisplay,
  onToggleExpand,
  onAddChild,
  onArchive,
  onRestore,
  onDelete,
  onClick,
  onEditClick,
  renderContent,
  renderActions,
}: BaseCardProps<T>) {
  const getItemColor = (scopeItem: T) => {
    return scopeItem.type?.color || scopeItem.category?.color || scopeItem.colorDisplay || 'none';
  };

  const isArchived = scopeItem.archivedAt !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="mb-2 relative transition-colors duration-200 hover:bg-accent cursor-pointer"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="text-muted-foreground hover:text-foreground mt-1"
              >
                {isExpanded ?
                  <ChevronDown size={20} className="mt-1" /> :
                  <ChevronRight size={20} className="mt-1" />}
              </button>
            )}
            <ColorDisplay
              color={getItemColor(scopeItem)}
              display={colorDisplay}
              objectType={objectType}
              scopeType={scopeType}
            />
            <div className="flex-grow cursor-pointer whitespace-pre-wrap">
              {renderContent(scopeItem)}
            </div>
            <div className="flex gap-2">
              {renderActions?.(scopeItem)}
              {!isArchived && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick();
                    }}
                    className="hidden md:block text-muted-foreground hover:text-foreground p-1 hover:bg-primary/20 justify-center"
                  >
                    <Pen size={20} className={'ml-[6.5px]'} />
                  </Button>
                  {['todo', 'brainstorm'].includes(scopeType) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddChild();
                      }}
                      className="text-muted-foreground hover:text-foreground p-1 hover:bg-primary/20"
                    >
                      <Plus size={20} className={'ml-[1px]'} />
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isArchived) {
                    onRestore();
                  } else {
                    onArchive();
                  }
                }}
                className="hidden md:block text-muted-foreground hover:text-foreground p-1 hover:bg-primary/20"
              >
                {isArchived ? 
                  <RotateCcw size={20} className={'ml-[6.5px]'} /> :
                  <Archive size={20} className={'ml-[6.5px]'} />
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-muted-foreground hover:text-foreground p-1 hover:bg-primary/20"
              >
                <Trash2 size={20} className="text-destructive ml-[0px]" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}