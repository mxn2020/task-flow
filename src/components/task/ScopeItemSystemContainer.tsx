// components/app/ScopeItemSystemContainer.tsx
'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { BaseItem, BaseProps } from '@/types/ui';
import { Category, Label, SystemScopeType, Type } from '@/types';

import { ColorPicker } from '@/components/app/ColorPicker';
import { BaseContainer } from './BaseContainer';
import { ScopeItemCard } from './ScopeItemCard';
import { ScopeItemDialog } from './ScopeItemDialog';
import { useScope } from '@/contexts/ScopeContext';
import { metadata } from '@/app/layout';
import { ScopeItem, Dependency, BaseScopeFormItem } from '@/types/scopes_2';

interface ScopeItemSystemContainerProps<T extends BaseItem> {
  scopeType: SystemScopeType | string;
  allowNesting: boolean;
  baseProps: BaseProps<T>;
}

export function ScopeItemSystemContainer<T extends BaseItem>({
  scopeType,
  allowNesting,
  baseProps,
}: ScopeItemSystemContainerProps<T>) {
  const [isHovering, setIsHovering] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'archived' | 'deleted'>('normal');

  const { selectedColor, setSelectedColor, createItem } = useScope();
  const { items: contextItems } = useScope();

  const selectedParentItem = contextItems.find(item => item.id === baseProps.itemOptions.parentId);

  const renderParentBadge = () => {
    if (!selectedParentItem || isDialogOpen) return null;

    return (
      <div className="mt-2">
        <Badge
          className="bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer"
          onClick={() => baseProps.onItemOptionsChange({ parentId: null })}
        >
          Parent: {selectedParentItem.title}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      </div>
    );
  };

  const renderAddForm = () => {
      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
    
        const baseItem = {
          id: crypto.randomUUID(),
          title: title.trim(),
          colorDisplay: selectedColor,
          parentId: baseProps.itemOptions.parentId,
          status: 'not_started' as const,
          isUrgent: false,
          isFavorite: false,
          isPrivate: false,
          visibilityLevel: 'private' as const,
          checklistItems: [],
          attachments: [],
          tags: [],
          customFields: {},
          createdAt: new Date().toISOString()
        };
    
        let newItem: Partial<ScopeItem>;
        switch (scopeType) {
          case 'todo':
            newItem = {
              ...baseItem,
              metadata: {}
            };
            break;
          case 'brainstorm':
          case 'note':
            newItem = {
              ...baseItem,
              metadata: {
                content: '-'
              }
            };
            break;
          case 'checklist':
            newItem = {
              ...baseItem,
              metadata: {
                items: []
              }
            };
            break;
          case 'flow':
            newItem = {
              ...baseItem,
              metadata: {
                dependencies: [] as Dependency[],
                flow_status: 'pending' as const,
                completionCriteria: '',
                subDependencies: {}
              }
            };
            break;
          case 'milestone':
            newItem = {
              ...baseItem,
              metadata: {
                successCriteria: [],
                progress: 0
              }
            };
            break;
          case 'resource':
            newItem = {
              ...baseItem,
              metadata: {
                format: 'article' as const,
                resourceTags: []
              }
            };
            break;
          case 'timeblock':
            newItem = {
              ...baseItem,
              metadata: {
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString()
              }
            };
            break;
          case 'event':
            newItem = {
              ...baseItem,
              metadata: {
                start: new Date().toISOString(),
                end: new Date().toISOString(),
                attendees: [],
                recurring: false
              }
            };
            break;
          case 'bookmark':
            newItem = {
              ...baseItem,
              metadata: {
                url: '',
                bookmarkTags: [],
                lastVisited: new Date().toISOString()
              }
            };
            break;
          default:
            newItem = {
              ...baseItem,
              metadata: {}
            };
        }
    
        await createItem(newItem);
    
        setTitle('');
        setSelectedColor('');
        baseProps.onItemOptionsChange({ parentId: null });
      };

    const handleCreate = async (newItem: Partial<ScopeItem>) => {
      setIsDialogOpen(false);
      await createItem(newItem);
      setTitle('');
      setSelectedColor('');
    };

    return (
      <>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row">
          <div className="w-full lg:flex-grow">
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Add new ${scopeType}...`}
              className="w-full"
            />
            {renderParentBadge()}
          </div>
          <div
            className="flex flex-row gap-2 w-full lg:w-auto lg:flex-col"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
            {(!title.trim() && isHovering) ? (
              <Button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="w-36"
              >
                <Plus className="mr-2" />
                Advanced
              </Button>
            ) : (
              <Button type="submit" className="w-36">
                <Plus className="mr-2" />
                Quick Add
              </Button>
            )}
          </div>
        </form>

        <ScopeItemDialog
          scopeType={scopeType}
          item={null}
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          parentId={baseProps.itemOptions.parentId}
          onClose={() => baseProps.onItemOptionsChange({ parentId: null })}
          onCreate={handleCreate}
        />
      </>
    );
  };

  const filterItemsByMode = (items: Array<T & { archivedAt?: string | null; deletedAt?: string | null }>) => {
    switch (viewMode) {
      case 'archived':
        return items.filter(item => item.archivedAt && !item.deletedAt);
      case 'deleted':
        return items.filter(item => item.deletedAt);
      default:
        return items.filter(item => !item.archivedAt && !item.deletedAt);
    }
  };

  const renderItemList = (
    items: Array<T & BaseItem>,
    labels: Label[],
    types: Type[],
    categories: Category[],
    parentId: string | null = null
  ): React.ReactNode => {
    const filteredItems = filterItemsByMode(items).filter(item => item.parentId === parentId);

    return filteredItems.map(item => {
      const hasChildren = items.some(t => t.parentId === item.id);
      const isExpanded = expandedItems.has(item.id);

      return (
        <React.Fragment key={item.id}>
          <div>
            <ScopeItemCard
              item={item}
              scopeType={scopeType}
              objectType="scope"
              labels={labels}
              types={types}
              categories={categories}
              hasChildren={hasChildren}
              isExpanded={isExpanded}
              allowNesting={allowNesting}
              colorDisplay={baseProps.viewOptions.colorDisplay}
              onToggleExpand={() => {
                const newExpanded = new Set(expandedItems);
                if (isExpanded) {
                  newExpanded.delete(item.id);
                } else {
                  newExpanded.add(item.id);
                }
                setExpandedItems(newExpanded);
              }}
              onAddChild={() => {
                baseProps.onItemOptionsChange({ parentId: item.id });
              }}
              onArchive={baseProps.onItemArchive}
              onDelete={baseProps.onItemDelete}
              onUpdate={baseProps.onItemUpdate}
            />
            {hasChildren && isExpanded && (
              <div className="ml-6">
                {renderItemList(
                  items,
                  labels,
                  types,
                  categories,
                  item.id
                )}
              </div>
            )}
          </div>
        </React.Fragment>
      );
    });
  };

  const sortItems = (items: T[]) => {
    const sorted = [...items];
    if (baseProps.viewOptions.sortBy === 'title') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return sorted;
  };

  const searchItems = (items: T[]) => {
    if (!baseProps.filterOptions.searchQuery) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(baseProps.filterOptions.searchQuery.toLowerCase())
    );
  };

  return (
    <BaseContainer
      {...baseProps}
      title={scopeType.charAt(0).toUpperCase() + scopeType.slice(1)}
      scopeType={scopeType}
      viewMode={viewMode}
      onViewModeChange={(mode) => setViewMode(mode)}
      renderAddForm={renderAddForm}
      renderItems={(items) => renderItemList(
        searchItems(sortItems(items)),
        baseProps.labels,
        baseProps.types,
        baseProps.categories
      )}
    />
  );
}