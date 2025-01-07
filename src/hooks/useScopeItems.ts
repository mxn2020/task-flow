// hooks/useScopeItems.ts

import { TemplateItem } from '@/types';
import { useCallback, useMemo } from 'react';
import { useScope } from '@/contexts/ScopeContext';
import { ScopeItem } from '@/types/scopes_2';

export function useScopeItems() {
  const scope = useScope();

  const scopeItems = useMemo(() => {
    return scope.items.filter((item): item is ScopeItem => 
      scope.scope.slug === scope.scopeSlug
    );
  }, [scope.items, scope.scope.name]);

  const createScopeItem = useCallback(async (data: Partial<ScopeItem>) => {
    return scope.createItem(data) as Promise<ScopeItem>;
  }, [scope.createItem]);

  const updateScopeItem = useCallback(async (id: string, data: Partial<ScopeItem>) => {
    return scope.updateItem(id, data) as Promise<ScopeItem>;
  }, [scope.updateItem]);

  const archiveScopeItem = useCallback(async (id: string) => {
    return scope.archiveItem(id);
  }, [scope.archiveItem]);

  const restoreScopeItem = useCallback(async (id: string) => {
    return scope.restoreItem(id);
  }, [scope.restoreItem]);

  const softDeleteScopeItem = useCallback(async (id: string) => {
    return scope.softDeleteItem(id);
  }, [scope.softDeleteItem]);

  const hardDeleteScopeItem = useCallback(async (id: string) => {
    return scope.hardDeleteItem(id);
  }, [scope.hardDeleteItem]);

  const bulkArchiveScopeItems = useCallback(async (ids: string[]) => {
    return scope.bulkArchiveItems(ids);
  }, [scope.bulkArchiveItems]);

  const bulkDeleteScopeItems = useCallback(async (ids: string[], hardDelete?: boolean) => {
    return scope.bulkDeleteItems(ids, hardDelete);
  }, [scope.bulkDeleteItems]);

  const createFromTemplate = useCallback(async (data: Partial<ScopeItem>, templateItems: TemplateItem[]) => {
    return scope.createFromTemplate(data, templateItems) as Promise<ScopeItem>;
  }, [scope.createFromTemplate]);

  return {
    scopeItems,
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
    createScopeItem,
    updateScopeItem,
    archiveScopeItem,
    restoreScopeItem,
    softDeleteScopeItem,
    hardDeleteScopeItem,
    bulkArchiveScopeItems,
    bulkDeleteScopeItems,
    refreshMetadata: scope.refreshMetadata
  };
}