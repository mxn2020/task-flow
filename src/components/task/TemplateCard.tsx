// components/app/TemplateCard.tsx

'use client';

import React from 'react';
import { Template } from '@/types';
import { BaseCard } from './BaseCard';
import { BaseItem, BaseTemplateItem } from '@/types/ui';

interface TemplateCardProps {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onArchive,
  onRestore
}: TemplateCardProps) {

  if (!template.id) return null;


  const renderTemplateContent = (template: BaseTemplateItem) => (
    <div className="flex flex-col">
      <div className="font-medium">{template.title}</div>
      <div className="text-sm text-muted-foreground">
        {(template.scopeType ?? '').charAt(0).toUpperCase() + (template.scopeType ?? '').slice(1)} Template
      </div>
    </div>
  );

  return (
    <BaseCard
      scopeItem={template}
      objectType='template'
      scopeType='all'
      hasChildren={false}
      isExpanded={false}
      colorDisplay="none"
      onToggleExpand={() => {}}
      onAddChild={() => {}}
      onArchive={onArchive}
      onRestore={onRestore}
      onDelete={onDelete}
      onClick={onEdit}
      onEditClick={onEdit}
      renderContent={renderTemplateContent}
    />
  );
}