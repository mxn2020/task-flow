// app/notes/page.tsx
'use client';

import { useEffect } from 'react';
import { ScopeItemSystemContainer } from '@/components/app/ScopeItemSystemContainer';
import { useNotes } from '@/hooks/useNotes';

export default function NotePage() {
  const {
    notes,
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
    createNote,
    updateNote,
    archiveNote,
    softDeleteNote,
    refreshMetadata,
  } = useNotes();

  useEffect(() => {
    refreshMetadata();
  }, [refreshMetadata]);

  return (
    <ScopeItemSystemContainer
      scopeType="note"
      baseProps={{
        items: notes,
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
        onItemCreate: createNote,
        onItemUpdate: updateNote,
        onItemArchive: archiveNote,
        onItemDelete: softDeleteNote,
      }}
    />
  );
}