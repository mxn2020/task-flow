// app/templates/page.tsx

'use client';

import { useEffect } from 'react';
import { useTemplates } from '@/contexts/TemplateContext';
import { TemplateSystemContainer } from '@/components/task/TemplateSystemContainer';

export default function TemplatePage() {
  const {
    templates,
    isLoading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    archiveTemplate,
    restoreTemplate,
  } = useTemplates();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <TemplateSystemContainer
      templates={templates}
      isLoading={isLoading}
      onTemplateCreate={createTemplate}
      onTemplateUpdate={updateTemplate}
      onTemplateDelete={deleteTemplate}
      onTemplateArchive={archiveTemplate}
      onTemplateRestore={restoreTemplate}
    />
  );
}

