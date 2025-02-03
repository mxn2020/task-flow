// hooks/useBrainstorms.ts

import { TemplateItem } from '@/types';
import { useCallback, useMemo } from 'react';
import { useScope } from '@/contexts/ScopeContext';
import { BrainstormScope } from '@/types/scopes_2';
import { ViewOptions, FilterOptions, ItemOptions } from '@/types/ui';

export function useBrainstorms() {
  const scope = useScope();

  const brainstorms = useMemo(() => {
    return scope.items.filter((item): item is BrainstormScope => 
      scope.scope.name === 'brainstorm'
    );
  }, [scope.items, scope.scope.name]);

  const createBrainstorm = useCallback(async (data: Partial<BrainstormScope>) => {
    return scope.createItem(data) as Promise<BrainstormScope>;
  }, [scope.createItem]);

  const updateBrainstorm = useCallback(async (id: string, data: Partial<BrainstormScope>) => {
    return scope.updateItem(id, data) as Promise<BrainstormScope>;
  }, [scope.updateItem]);

  const archiveBrainstorm = useCallback(async (id: string) => {
    return scope.archiveItem(id);
  }, [scope.archiveItem]);

  const restoreBrainstorm = useCallback(async (id: string) => {
    return scope.restoreItem(id);
  }, [scope.restoreItem]);

  const softDeleteBrainstorm = useCallback(async (id: string) => {
    return scope.softDeleteItem(id);
  }, [scope.softDeleteItem]);

  const hardDeleteBrainstorm = useCallback(async (id: string) => {
    return scope.hardDeleteItem(id);
  }, [scope.hardDeleteItem]);

  const bulkArchiveBrainstorms = useCallback(async (ids: string[]) => {
    return scope.bulkArchiveItems(ids);
  }, [scope.bulkArchiveItems]);

  const bulkDeleteBrainstorms = useCallback(async (ids: string[], hardDelete?: boolean) => {
    return scope.bulkDeleteItems(ids, hardDelete);
  }, [scope.bulkDeleteItems]);

  const createFromTemplate = useCallback(async (data: Partial<BrainstormScope>, templateItems: TemplateItem[]) => {
    return scope.createFromTemplate(data, templateItems) as Promise<BrainstormScope>;
  }, [scope.createFromTemplate]);

  return {
    brainstorms,
    allowNesting: scope.scope.allowNesting,
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
    createBrainstorm,
    updateBrainstorm,
    archiveBrainstorm,
    restoreBrainstorm,
    softDeleteBrainstorm,
    hardDeleteBrainstorm,
    bulkArchiveBrainstorms,
    bulkDeleteBrainstorms,
    refreshMetadata: scope.refreshMetadata
  };
}