// hooks/useTodos.ts

import { TemplateItem } from '@/types';
import { useCallback, useMemo } from 'react';
import { useScope } from '@/contexts/ScopeContext';
import { ViewOptions, FilterOptions, ItemOptions } from '@/types/ui';
import { TodoScope } from '@/types/scopes_2';

export function useTodos() {
  const scope = useScope();

  const todos = useMemo(() => {
    return scope.items.filter((item): item is TodoScope => 
      scope.scope.name === 'todo'
    );
  }, [scope.items, scope.scope.name]);

  const createTodo = useCallback(async (data: Partial<TodoScope>) => {
    return scope.createItem(data) as Promise<TodoScope>;
  }, [scope.createItem]);

  const updateTodo = useCallback(async (id: string, data: Partial<TodoScope>) => {
    return scope.updateItem(id, data) as Promise<TodoScope>;
  }, [scope.updateItem]);

  const archiveTodo = useCallback(async (id: string) => {
    return scope.archiveItem(id);
  }, [scope.archiveItem]);

  const restoreTodo = useCallback(async (id: string) => {
    return scope.restoreItem(id);
  }, [scope.restoreItem]);

  const softDeleteTodo = useCallback(async (id: string) => {
    return scope.softDeleteItem(id);
  }, [scope.softDeleteItem]);

  const hardDeleteTodo = useCallback(async (id: string) => {
    return scope.hardDeleteItem(id);
  }, [scope.hardDeleteItem]);

  const bulkArchiveTodos = useCallback(async (ids: string[]) => {
    return scope.bulkArchiveItems(ids);
  }, [scope.bulkArchiveItems]);

  const bulkDeleteTodos = useCallback(async (ids: string[], hardDelete?: boolean) => {
    return scope.bulkDeleteItems(ids, hardDelete);
  }, [scope.bulkDeleteItems]);

  const createFromTemplate = useCallback(async (data: Partial<TodoScope>, templateItems: TemplateItem[]) => {
    return scope.createFromTemplate(data, templateItems) as Promise<TodoScope>;
  }, [scope.createFromTemplate]);

  return {
    todos,
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
    createTodo,
    updateTodo,
    archiveTodo,
    restoreTodo,
    softDeleteTodo,
    hardDeleteTodo,
    bulkArchiveTodos,
    bulkDeleteTodos,
    refreshMetadata: scope.refreshMetadata
  };
}