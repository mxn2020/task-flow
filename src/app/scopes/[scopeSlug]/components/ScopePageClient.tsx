// app/scopes/[scopeSlug]/components/ScopePageClient.tsx
'use client';

import { useEffect } from 'react';
import { ScopeItemSystemContainer } from '@/components/task/ScopeItemSystemContainer';
import { useScopeItems } from '@/hooks/useScopeItems';

interface ScopePageClientProps {
  scopeSlug: string;
}

export function ScopePageClient({ scopeSlug }: ScopePageClientProps) {
  const {
    scopeItems,
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
    createScopeItem,
    updateScopeItem,
    archiveScopeItem,
    softDeleteScopeItem,
    refreshMetadata,
  } = useScopeItems();

  useEffect(() => {
    refreshMetadata();
  }, [refreshMetadata]);

  return (
    <ScopeItemSystemContainer
      scopeType={scopeSlug}
      baseProps={{
        items: scopeItems,
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
        onItemCreate: createScopeItem,
        onItemUpdate: updateScopeItem,
        onItemArchive: archiveScopeItem,
        onItemDelete: softDeleteScopeItem,
      }}
    />
  );
}