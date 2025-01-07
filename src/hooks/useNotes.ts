// hooks/useNotes.ts

import { TemplateItem } from '@/types';
import { useCallback, useMemo } from 'react';
import { useScope } from '@/contexts/ScopeContext';
import { ViewOptions, FilterOptions, ItemOptions } from '@/types/ui';
import { NoteScope } from '@/types/scopes_2';

export function useNotes() {
  const scope = useScope();

  const notes = useMemo(() => {
    return scope.items.filter((item): item is NoteScope => 
      scope.scope.name === 'note'
    );
  }, [scope.items, scope.scope.name]);

  const createNote = useCallback(async (data: Partial<NoteScope>) => {
    return scope.createItem(data) as Promise<NoteScope>;
  }, [scope.createItem]);

  const updateNote = useCallback(async (id: string, data: Partial<NoteScope>) => {
    return scope.updateItem(id, data) as Promise<NoteScope>;
  }, [scope.updateItem]);

  const archiveNote = useCallback(async (id: string) => {
    return scope.archiveItem(id);
  }, [scope.archiveItem]);

  const restoreNote = useCallback(async (id: string) => {
    return scope.restoreItem(id);
  }, [scope.restoreItem]);

  const softDeleteNote = useCallback(async (id: string) => {
    return scope.softDeleteItem(id);
  }, [scope.softDeleteItem]);

  const hardDeleteNote = useCallback(async (id: string) => {
    return scope.hardDeleteItem(id);
  }, [scope.hardDeleteItem]);

  const bulkArchiveNotes = useCallback(async (ids: string[]) => {
    return scope.bulkArchiveItems(ids);
  }, [scope.bulkArchiveItems]);

  const bulkDeleteNotes = useCallback(async (ids: string[], hardDelete?: boolean) => {
    return scope.bulkDeleteItems(ids, hardDelete);
  }, [scope.bulkDeleteItems]);

  const createFromTemplate = useCallback(async (data: Partial<NoteScope>, templateItems: TemplateItem[]) => {
    return scope.createFromTemplate(data, templateItems) as Promise<NoteScope>;
  }, [scope.createFromTemplate]);

  return {
    notes,
    selectedColor: scope.selectedColor,
    setSelectedColor: scope.setSelectedColor,
    createFromTemplate,
    groups: scope.groups,
    types: scope.types,
    categories: scope.categories,
    labels: scope.labels,
    viewOptions: scope.viewOptions,
    filterOptions: scope.filterOptions,
    itemOptions: scope.itemOptions,
    isLoading: scope.isLoading,
    error: scope.error,
    setViewOptions: scope.setViewOptions,
    setFilterOptions: scope.setFilterOptions,
    setItemOptions: scope.setItemOptions,
    createNote,
    updateNote,
    archiveNote,
    restoreNote,
    softDeleteNote,
    hardDeleteNote,
    bulkArchiveNotes,
    bulkDeleteNotes,
    refreshMetadata: scope.refreshMetadata
  };
}