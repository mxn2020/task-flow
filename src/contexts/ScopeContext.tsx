// contexts/ScopeContext.tsx

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Todo, Label, Type, Category, Group, TodoLabel, TemplateItem, Scope, SystemScopeType } from '@/types';
import { ScopeItem } from '@/types/scopes_2';
import { ViewOptions, FilterOptions, ItemOptions } from '@/types/ui';
import { toCamelCase, toSnakeCase } from '@/lib/utils';
import { validateScope, validateSystemScope } from '@/utils/validation';

interface ScopeContextType {
  scopeSlug: string;
  items: ScopeItem[];
  scope: Scope;
  groups: Group[];
  types: Type[];
  categories: Category[];
  labels: Label[];
  viewOptions: ViewOptions;
  filterOptions: FilterOptions;
  itemOptions: ItemOptions;
  isLoading: boolean;
  error: Error | null;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  setViewOptions: (options: Partial<ViewOptions>) => void;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  setItemOptions: (options: Partial<ItemOptions>) => void;
  createItem: (data: Partial<ScopeItem>) => Promise<ScopeItem>;
  createFromTemplate: (data: Partial<ScopeItem>, templateItems: TemplateItem[]) => Promise<ScopeItem>;
  updateItem: (id: string, data: Partial<ScopeItem>) => Promise<ScopeItem>;
  archiveItem: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
  softDeleteItem: (id: string) => Promise<void>;
  hardDeleteItem: (id: string) => Promise<void>;
  bulkArchiveItems: (ids: string[]) => Promise<void>;
  bulkDeleteItems: (ids: string[], hardDelete?: boolean) => Promise<void>;
  refreshMetadata: () => Promise<void>;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

interface InitialData {
  items: ScopeItem[];
  scope: Scope;
  types: Type[];
  categories: Category[];
  labels: Label[];
  groups: Group[];
}

export function ScopeProvider({
  children,
  userId,
  scopeId,
  scopeSlug = 'scopeItem',
  initialData
}: {
  children: React.ReactNode;
  userId: string;
  scopeId: string;
  scopeSlug?: string;
  initialData: InitialData;
}) {
  const [items, setItems] = useState<ScopeItem[]>(initialData.items);
  const [scope, setScope] = useState<Scope>(initialData.scope);
  const [groups, setGroups] = useState<Group[]>(initialData.groups);
  const [types, setTypes] = useState<Type[]>(initialData.types);
  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [labels, setLabels] = useState<Label[]>(initialData.labels);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');

  const [viewOptions, setViewOptions] = useState<ViewOptions>({
    colorDisplay: 'vertical',
    sortBy: 'created',
    isAdvancedMode: false
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    selectedGroup: null,
    selectedType: null,
    selectedCategory: null,
    selectedLabels: [],
    labelSearchQuery: '',
    searchQuery: ''
  });

  const [itemOptions, setItemOptions] = useState<ItemOptions>({
    parentId: null,
    groupId: null
  });

  const refreshMetadata = useCallback(async () => {
    try {
      setIsLoading(true);
      const [scopeRes, typesRes, categoriesRes, labelsRes, groupsRes] = await Promise.all([
        supabase.from('scopes').select('*').eq('id', scopeId).single(),
        supabase.from('types').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('labels').select('*').eq('user_id', userId),
        supabase.from('groups').select('*').eq('user_id', userId)
      ]);

      if (scopeRes.data) setScope(toCamelCase(scopeRes.data));
      if (typesRes.data) setTypes(toCamelCase(typesRes.data));
      if (categoriesRes.data) setCategories(toCamelCase(categoriesRes.data));
      if (labelsRes.data) setLabels(toCamelCase(labelsRes.data));
      if (groupsRes.data) setGroups(toCamelCase(groupsRes.data));

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, scopeId]);

  const optimisticUpdate = useCallback(async <T,>(
    operation: () => Promise<T>,
    rollbackData: ScopeItem[],
    tempItem: ScopeItem
  ): Promise<T> => {
    try {
      const result = await operation();
      setItems(prev => prev.map(item =>
        item.id === tempItem.id ? result as ScopeItem : item
      ));
      return result;
    } catch (err) {
      setItems(rollbackData);
      setError(err as Error);
      throw err;
    }
  }, []);

  const validateItem = useCallback((data: Partial<ScopeItem>, isDatabase = false) => {

    if (scope.isSystem) {
      validateSystemScope(scope.name as SystemScopeType, data, isDatabase);
    }
    
    validateScope(scope, data, isDatabase);
  }, [scope]);

  const createItem = useCallback(async (data: Partial<ScopeItem>): Promise<ScopeItem> => {
    console.log('valiating data', data);
    validateItem(data);
    console.log('data validated');
    const { labels, typeId, categoryId, ...itemData } = data;
    const newItem = {
      ...itemData,
      userId,
      scopeId,
      createdAt: new Date().toISOString(),
      colorDisplay: data.colorDisplay
    };

    const processedData = {
      ...itemData,
      userId,
      scopeId,
      typeId: typeId === 'all' || typeId === '' ? null : typeId,
      categoryId: categoryId === 'all' || categoryId === '' ? null : categoryId,
    };

    const tempId = crypto.randomUUID();
    const optimisticItem = {
      ...newItem,
      id: tempId,
      typeId: processedData.typeId,
      categoryId: processedData.categoryId,
      labels: labels || [],
      type: types.find(t => t.id === processedData.typeId),
      category: categories.find(c => c.id === processedData.categoryId)
    } as ScopeItem;

    const previousItems = [...items];
    setItems(prev => [...prev, optimisticItem]);

    const operation = async () => {
      const { data: createdItemData, error: itemError } = await supabase
        .from('todos')
        .insert([toSnakeCase(processedData)])
        .select(`
          *,
          type:types!left(id, name, color),
          category:categories!left(id, name, color)
        `)
        .single();

      if (itemError) throw itemError;

      if (labels?.length) {
        const labelRecords = labels.map(label => ({
          todo_id: createdItemData.id,
          label_id: label.id
        }));
        await supabase.from('todo_labels').insert(labelRecords);
      }

      return {
        ...toCamelCase(createdItemData),
        labels: labels || []
      } as ScopeItem;
    };

    return optimisticUpdate(operation, previousItems, optimisticItem);
  }, [optimisticUpdate, items, types, categories, userId, scopeId]);

  const createNestedItems = useCallback(async (
    items: TemplateItem[],
    parentId: string,
    userId: string,
    optimisticIds: Map<string, string> = new Map()
  ): Promise<ScopeItem[]> => {
    const nestedItems: ScopeItem[] = [];

    const createNested = async (items: TemplateItem[], parentId: string) => {
      for (const item of items) {
        const tempId = crypto.randomUUID();
        const itemData = {
          userId,
          scopeId,
          parentId,
          title: item.title,
          status: item.status,
          priorityLevel: item.priorityLevel,
          checklistItems: item.checklistItems,
          customFields: item.customFields,
          estimatedDuration: item.estimatedDuration,
          createdAt: new Date().toISOString()
        };

        const { data: newItem, error } = await supabase
          .from('todos')
          .insert([toSnakeCase(itemData)])
          .select()
          .single();

        if (error) throw error;

        optimisticIds.set(tempId, newItem.id);
        const processedItem = toCamelCase(newItem) as ScopeItem;
        nestedItems.push(processedItem);

        if (item.children?.length) {
          await createNested(item.children, newItem.id);
        }
      }
    };

    await createNested(items, parentId);
    return nestedItems;
  }, [scopeId]);

  const createFromTemplate = useCallback(async (
    data: Partial<ScopeItem>,
    templateItems: TemplateItem[]
  ): Promise<ScopeItem> => {
    const { labels, typeId, categoryId, ...itemData } = data;
    const newItem = {
      ...itemData,
      userId,
      scopeId,
      createdAt: new Date().toISOString(),
      colorDisplay: data.colorDisplay
    };

    const processedData = {
      ...itemData,
      userId,
      scopeId,
      typeId: typeId === 'all' || typeId === '' ? null : typeId,
      categoryId: categoryId === 'all' || categoryId === '' ? null : categoryId
    };

    const tempId = crypto.randomUUID();
    const optimisticItem = {
      ...newItem,
      id: tempId,
      typeId: processedData.typeId,
      categoryId: processedData.categoryId,
      labels: labels || [],
      type: types.find(t => t.id === processedData.typeId),
      category: categories.find(c => c.id === processedData.categoryId)
    } as ScopeItem;

    const createOptimisticNested = (items: TemplateItem[], parentId: string): ScopeItem[] => {
      return items.flatMap(item => {
        const tempId = crypto.randomUUID();
        const scopeItem = {
          id: tempId,
          userId,
          scopeId,
          parentId,
          title: item.title,
          status: item.status,
          priorityLevel: item.priorityLevel,
          checklistItems: item.checklistItems,
          customFields: item.customFields,
          estimatedDuration: item.estimatedDuration,
          createdAt: new Date().toISOString()
        } as ScopeItem;

        return [
          scopeItem,
          ...(item.children ? createOptimisticNested(item.children, tempId) : [])
        ];
      });
    };

    const optimisticNested = createOptimisticNested(templateItems, tempId);
    const previousItems = [...items];

    setItems(prev => [...prev, optimisticItem, ...optimisticNested]);

    const operation = async () => {
      const { data: createdItemData, error: itemError } = await supabase
        .from('todos')
        .insert([toSnakeCase(processedData)])
        .select(`
          *,
          type:types!left(id, name, color),
          category:categories!left(id, name, color)
        `)
        .single();

      if (itemError) throw itemError;

      if (labels?.length) {
        const labelRecords = labels.map(label => ({
          todo_id: createdItemData.id,
          label_id: label.id
        }));
        await supabase.from('todo_labels').insert(labelRecords);
      }

      const createdNested = await createNestedItems(
        templateItems,
        createdItemData.id,
        userId
      );

      const mainItem = {
        ...toCamelCase(createdItemData),
        labels: labels || []
      } as ScopeItem;

      setItems(prev => [
        ...prev.filter(t => t.id !== tempId && !optimisticNested.find(n => n.id === t.id)),
        mainItem,
        ...createdNested
      ]);

      return mainItem;
    };

    return optimisticUpdate(operation, previousItems, optimisticItem);
  }, [createNestedItems, optimisticUpdate, items, types, categories, userId, scopeId]);

  const updateItem = useCallback(async (id: string, data: Partial<ScopeItem>): Promise<ScopeItem> => {
    validateItem(data);
    const { labels, typeId, categoryId, ...itemData } = data;
    const existingItem = items.find(t => t.id === id);

    if (!existingItem) {
      throw new Error('Item not found');
    }

    const processedData = {
      ...itemData,
      typeId: typeId === 'all' || typeId === '' ? null : typeId,
      categoryId: categoryId === 'all' || categoryId === '' ? null : categoryId,
      colorDisplay: data.colorDisplay
    };

    const optimisticItem = {
      ...existingItem,
      ...itemData,
      typeId: processedData.typeId,
      categoryId: processedData.categoryId,
      labels: labels ?? existingItem.labels,
      type: types.find(t => t.id === processedData.typeId) || existingItem.type,
      category: categories.find(c => c.id === processedData.categoryId) || existingItem.category
    } as ScopeItem;

    const previousItems = [...items];
    setItems(prev => prev.map(t => t.id === id ? optimisticItem : t));

    const operation = async () => {
      const { data: updatedItemData, error: itemError } = await supabase
        .from('todos')
        .update(toSnakeCase(processedData))
        .eq('id', id)
        .select(`
          *,
          type:types!left(id, name, color),
          category:categories!left(id, name, color)
        `)
        .single();

      if (itemError) throw itemError;

      if (labels !== undefined) {
        await supabase.from('todo_labels').delete().eq('todo_id', id);

        if (labels.length > 0) {
          const labelRecords = labels.map(label => ({
            todo_id: id,
            label_id: label.id
          }));
          await supabase.from('todo_labels').insert(labelRecords);
        }
      }

      return {
        ...toCamelCase(updatedItemData),
        labels: labels ?? existingItem.labels
      } as ScopeItem;
    };

    return optimisticUpdate(operation, previousItems, optimisticItem);
  }, [optimisticUpdate, items, types, categories]);

  const archiveItem = useCallback(async (id: string): Promise<void> => {
    const previousItems = [...items];
    const tempItem = items.find(t => t.id === id);
    const updatedItem = { ...tempItem!, archivedAt: new Date().toISOString() };

    setItems(prev => prev.map(t => t.id === id ? updatedItem : t));

    const operation = async () => {
      const { data, error } = await supabase
        .from('todos')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    };

    await optimisticUpdate(operation, previousItems, updatedItem);
  }, [optimisticUpdate, items]);

  const restoreItem = useCallback(async (id: string) => {
    const previousItems = [...items];
    const tempItem = items.find(t => t.id === id)!;
    const updatedItem = { ...tempItem, archivedAt: null, deletedAt: null };
    setItems(prev => prev.map(t => t.id === id ? updatedItem : t));

    const operation = async () => {
      const { data, error } = await supabase
        .from('todos')
        .update({ archived_at: null })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    };

    await optimisticUpdate(operation, previousItems, updatedItem);
  }, [optimisticUpdate, items]);

  const softDeleteItem = useCallback(async (id: string) => {
    const previousItems = [...items];
    const tempItem = items.find(t => t.id === id)!;
    const updatedItem = { ...tempItem, deletedAt: new Date().toISOString() };
    setItems(prev => prev.filter(t => t.id !== id));

    const operation = async () => {
      await supabase
        .from('todos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    };

    await optimisticUpdate(operation, previousItems, updatedItem);
  }, [optimisticUpdate, items]);

  const hardDeleteItem = useCallback(async (id: string) => {
    const previousItems = [...items];
    const tempItem = items.find(t => t.id === id)!;
    setItems(prev => prev.filter(t => t.id !== id));

    const operation = async () => {
      await supabase.from('todos').delete().eq('id', id);
    };

    await optimisticUpdate(operation, previousItems, tempItem);
  }, [optimisticUpdate, items]);

  const bulkArchiveItems = useCallback(async (ids: string[]) => {
    const previousItems = [...items];
    const tempItem = items.find(t => t.id === ids[0])!;
    const updatedItem = { ...tempItem, archivedAt: new Date().toISOString() };
    setItems(prev => prev.map(t =>
      ids.includes(t.id) ? { ...t, archivedAt: new Date().toISOString() } : t
    ));

    const operation = async () => {
      await supabase
        .from('todos')
        .update({ archived_at: new Date().toISOString() })
        .in('id', ids);
    };

    await optimisticUpdate(operation, previousItems, updatedItem);
  }, [optimisticUpdate, items]);

  const bulkDeleteItems = useCallback(async (ids: string[], hardDelete = false) => {
    const previousItems = [...items];
    const tempItem = items.find(t => t.id === ids[0])!;
    const updatedItem = { ...tempItem, deletedAt: new Date().toISOString() };
    setItems(prev => prev.filter(t => !ids.includes(t.id)));

    const operation = async () => {
      if (hardDelete) {
        await supabase.from('todos').delete().in('id', ids);
      } else {
        await supabase
          .from('todos')
          .update({ deleted_at: new Date().toISOString() })
          .in('id', ids);
      }
    };

    await optimisticUpdate(operation, previousItems, updatedItem);
  }, [optimisticUpdate, items]);

  const setViewOptionsCallback = useCallback((options: Partial<ViewOptions>) =>
    setViewOptions(prev => ({ ...prev, ...options })), []);

  const setFilterOptionsCallback = useCallback((options: Partial<FilterOptions>) =>
    setFilterOptions(prev => ({ ...prev, ...options })), []);

  const setItemOptionsCallback = useCallback((options: Partial<ItemOptions>) =>
    setItemOptions(prev => ({ ...prev, ...options })), []);

  const value = {
    scopeSlug,
    selectedColor,
    setSelectedColor,
    items,
    scope,
    groups,
    types,
    categories,
    labels,
    viewOptions,
    filterOptions,
    itemOptions,
    isLoading,
    error,
    setViewOptions: setViewOptionsCallback,
    setFilterOptions: setFilterOptionsCallback,
    setItemOptions: setItemOptionsCallback,
    createItem,
    createFromTemplate,
    updateItem,
    archiveItem,
    restoreItem,
    softDeleteItem,
    hardDeleteItem,
    bulkArchiveItems,
    bulkDeleteItems,
    refreshMetadata
  };

  return (
    <ScopeContext.Provider value={value}>
      {children}
    </ScopeContext.Provider>
  );
}

export const useScope = () => {
  const context = useContext(ScopeContext);
  if (context === undefined) {
    throw new Error('useScope must be used within a ScopeProvider');
  }
  return context;
};