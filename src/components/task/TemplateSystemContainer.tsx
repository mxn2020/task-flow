// components/app/TemplateSystemContainer.tsx

'use client';

import React, { useState } from 'react';
import { SystemScopeType, Template } from '@/types';
import { TemplateList } from './TemplateList';
import { TemplateCreateModal } from './TemplateCreateModal';
import { TemplateEditModal } from './TemplateEditModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Archive, ChevronsUpDown, Layout, LayoutGrid, ListChecks, Trash2, X } from 'lucide-react';

interface TemplateSystemContainerProps {
  templates: Template[];
  isLoading: boolean;
  onTemplateCreate: (template: Partial<Template>) => Promise<Template>;
  onTemplateUpdate: (id: string, template: Partial<Template>) => Promise<Template>;
  onTemplateDelete: (id: string) => Promise<void>;
  onTemplateArchive: (id: string) => Promise<void>;
  onTemplateRestore: (id: string) => Promise<void>;
}

export function TemplateSystemContainer({
  templates,
  isLoading,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  onTemplateArchive,
  onTemplateRestore
}: TemplateSystemContainerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeTypeFilter, setItemTypeFilter] = useState<SystemScopeType | string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'title'>('created');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'archived' | 'deleted'>('normal');

  const filteredTemplates = templates.filter(template => {
    if (scopeTypeFilter !== 'all' && template.scopeType !== scopeTypeFilter) {
      return false;
    }

    if (searchQuery) {
      return template.title.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true;
  });

  const filterTemplatesByMode = (templates: Template[]) => {
    switch (viewMode) {
      case 'archived':
        return templates.filter(template => template.archivedAt && !template.deletedAt);
      case 'deleted':
        return templates.filter(template => template.deletedAt);
      default:
        return templates.filter(template => !template.archivedAt && !template.deletedAt);
    }
  };

  const sortedTemplates = filterTemplatesByMode([...filteredTemplates]).sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
  });

  const onViewModeChange = (mode: 'normal' | 'archived' | 'deleted') => {
    setViewMode(mode);
  }

  return (
    <div className="max-w-4xl mx-auto mt-0 md:mt-10">
      <Card className="mb-6 shadow-none border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Templates
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              className="ml-2"
            >
              {isAdvancedMode ?
                <LayoutGrid size={20} className="text-primary" /> :
                <Layout size={20} />
              }
            </Button>
          </CardTitle>

          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const modes: Array<'normal' | 'archived' | 'deleted'> = ['normal', 'archived', 'deleted'];
                const currentIndex = modes.indexOf(viewMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                onViewModeChange?.(modes[nextIndex]);
              }}
              className="flex flex-col items-center h-auto min-h-[4rem] px-3"
            >
              {viewMode === 'normal' && (
                <>
                  <ListChecks size={20} />
                  <span className="text-xs text-green-600 font-medium mt-1">Active</span>
                </>
              )}
              {viewMode === 'archived' && (
                <>
                  <Archive size={20} />
                  <span className="text-xs text-purple-600 font-medium mt-1">Archived</span>
                </>
              )}
              {viewMode === 'deleted' && (
                <>
                  <Trash2 size={20} />
                  <span className="text-xs text-red-600 font-medium mt-1">Deleted</span>
                </>
              )}
            </Button>
          </div>


        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
              />
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> New Template
              </Button>
            </div>

            {isAdvancedMode && (
              <Card className="p-4">
                <div className="flex flex-wrap gap-4">
                  <Select value={scopeTypeFilter} onValueChange={(value: any) => setItemTypeFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="brainstorm">Brainstorm</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Created Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <TemplateList
        templates={sortedTemplates}
        isLoading={isLoading}
        onEdit={setEditingTemplate}
        onDelete={onTemplateDelete}
        onArchive={onTemplateArchive}
        onRestore={onTemplateRestore}
      />

      <TemplateCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={onTemplateCreate}
      />

      {editingTemplate && (
        <TemplateEditModal
          template={editingTemplate}
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onUpdate={async (template: Template) => {
            await onTemplateUpdate(editingTemplate.id!, template);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}