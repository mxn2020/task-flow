// app/brainstorms/page.tsx
'use client';

import { useEffect } from 'react';
import { ScopeItemSystemContainer } from '@/components/task/ScopeItemSystemContainer';
import { useBrainstorms } from '@/hooks/useBrainstorms';

export default function BrainstormPage() {
  const {
    allowNesting,
    brainstorms,
    groups,
    types,
    categories,
    labels,
    viewOptions,
    filterOptions,
    itemOptions,
    setViewOptions,
    setFilterOptions,
    setItemOptions,
    createBrainstorm,
    updateBrainstorm,
    archiveBrainstorm,
    softDeleteBrainstorm,
    refreshMetadata,
  } = useBrainstorms();

  useEffect(() => {
    refreshMetadata();
  }, [refreshMetadata]);

  return (
    <ScopeItemSystemContainer
      scopeType="brainstorm"
      allowNesting={allowNesting}
      baseProps={{
        items: brainstorms,
        groups,
        types,
        categories,
        labels,
        viewOptions,
        filterOptions,
        itemOptions,
        onViewOptionsChange: setViewOptions,
        onFilterOptionsChange: setFilterOptions,
        onItemOptionsChange: setItemOptions,
        onItemCreate: createBrainstorm,
        onItemUpdate: updateBrainstorm,
        onItemArchive: archiveBrainstorm,
        onItemDelete: softDeleteBrainstorm,
      }}
    />
  );
}