// components/app/TemplateList.tsx

'use client';

import React from 'react';
import { Template } from '@/types';
import { TemplateCard } from './TemplateCard';

interface TemplateListProps {
  templates: Template[];
  isLoading: boolean;
  onEdit: (template: Template) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onRestore: (id: string) => Promise<void>;
}

export function TemplateList({
  templates,
  isLoading,
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: TemplateListProps) {
  if (isLoading) {
    return <div className="p-4 text-center">Loading templates...</div>;
  }

  if (!templates.length) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No templates found. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onEdit={() => onEdit(template)}
          onDelete={() => onDelete(template.id!)}
          onArchive={() => template.archivedAt ? onRestore(template.id!) : onArchive(template.id!)}
          onRestore={() => onRestore(template.id!)}
        />
      ))}
    </div>
  );
}