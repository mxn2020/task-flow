// contexts/TodoContext.tsx

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Todo, Label, Type, Category, Group, TodoLabel, TemplateItem } from '@/types';
import { ViewOptions, FilterOptions, ItemOptions } from '@/types/ui';
import { toCamelCase, toSnakeCase } from '@/lib/utils';

interface TodoContextType {
  todos: Todo[];
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
  createTodo: (data: Partial<Todo>) => Promise<Todo>;
  createFromTemplate: (data: Partial<Todo>, templateItems: TemplateItem[]) => Promise<Todo>;
  updateTodo: (id: string, data: Partial<Todo>) => Promise<Todo>;
  archiveTodo: (id: string) => Promise<void>;
  restoreTodo: (id: string) => Promise<void>;
  softDeleteTodo: (id: string) => Promise<void>;
  hardDeleteTodo: (id: string) => Promise<void>;
  bulkArchiveTodos: (ids: string[]) => Promise<void>;
  bulkDeleteTodos: (ids: string[], hardDelete?: boolean) => Promise<void>;
  refreshMetadata: () => Promise<void>;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

interface InitialData {
  todos: Todo[];
  types: Type[];
  categories: Category[];
  labels: Label[];
  groups: Group[];
}

export function TodoProvider({
  children,
  userId,
  initialData
}: {
  children: React.ReactNode;
  userId: string;
  initialData: InitialData;
}) {
  const [todos, setTodos] = useState<Todo[]>(initialData.todos);
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
      const [typesRes, categoriesRes, labelsRes, groupsRes] = await Promise.all([
        supabase.from('types').select('*').eq('user_id', userId),
        supabase.from('categories').select('*').eq('user_id', userId),
        supabase.from('labels').select('*').eq('user_id', userId),
        supabase.from('groups').select('*').eq('user_id', userId)
      ]);

      if (typesRes.data) setTypes(typesRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (labelsRes.data) setLabels(labelsRes.data);
      if (groupsRes.data) setGroups(groupsRes.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const optimisticUpdate = useCallback(async <T,>(
    operation: () => Promise<T>,
    rollbackData: Todo[],
    tempTodo: Todo
  ): Promise<T> => {
    try {
      const result = await operation();
      setTodos(prev => prev.map(todo =>
        todo.id === tempTodo.id ? result as Todo : todo
      ));
      return result;
    } catch (err) {
      setTodos(rollbackData);
      setError(err as Error);
      throw err;
    }
  }, []);

  const createTodo = useCallback(async (data: Partial<Todo>): Promise<Todo> => {
    const { labels, typeId, categoryId, ...todoData } = data;
    const newTodo = {
      ...todoData,
      userId,
      createdAt: new Date().toISOString(),
      colorDisplay: data.colorDisplay
    };

    const processedData = {
      ...todoData,
      userId,
      typeId: typeId === 'all' || typeId === '' ? null : typeId,
      categoryId: categoryId === 'all' || categoryId === '' ? null : categoryId,
    };

    const tempId = crypto.randomUUID();
    const optimisticTodo = {
      ...newTodo,
      id: tempId,
      typeId: processedData.typeId,
      categoryId: processedData.categoryId,
      labels: labels || [],
      type: types.find(t => t.id === processedData.typeId),
      category: categories.find(c => c.id === processedData.categoryId)
    } as Todo;

    const previousTodos = [...todos];
    setTodos(prev => [...prev, optimisticTodo]);

    const operation = async () => {
      const { data: createdTodoData, error: todoError } = await supabase
        .from('todos')
        .insert([toSnakeCase(processedData)])
        .select(`
          *,
          type:types!left(id, name, color),
          category:categories!left(id, name, color)
        `)
        .single();

      if (todoError) throw todoError;

      if (labels?.length) {
        const labelRecords = labels.map(label => ({
          todo_id: createdTodoData.id,
          label_id: label.id
        }));
        await supabase.from('todo_labels').insert(labelRecords);
      }

      return {
        ...toCamelCase(createdTodoData),
        labels: labels || []
      } as Todo;
    };

    return optimisticUpdate(operation, previousTodos, optimisticTodo);
  }, [optimisticUpdate, todos, types, categories, userId]);

  const createNestedTodos = useCallback(async (
    items: TemplateItem[],
    parentId: string,
    userId: string,
    optimisticIds: Map<string, string> = new Map()
  ): Promise<Todo[]> => {
    const nestedTodos: Todo[] = [];

    const createNested = async (items: TemplateItem[], parentId: string) => {
      for (const item of items) {
        const tempId = crypto.randomUUID();
        const todoData = {
          userId,
          parentId,
          title: item.title,
          createdAt: new Date().toISOString()
        };

        const { data: newTodo, error } = await supabase
          .from('todos')
          .insert([toSnakeCase(todoData)])
          .select()
          .single();

        if (error) throw error;

        optimisticIds.set(tempId, newTodo.id);
        const processedTodo = toCamelCase(newTodo) as Todo;
        nestedTodos.push(processedTodo);

        if (item.children?.length) {
          await createNested(item.children, newTodo.id);
        }
      }
    };

    await createNested(items, parentId);
    return nestedTodos;
  }, []);

  const createFromTemplate = useCallback(async (
    data: Partial<Todo>,
    templateItems: TemplateItem[]
  ): Promise<Todo> => {
    const { labels, typeId, categoryId, ...todoData } = data;
    const newTodo = {
      ...todoData,
      userId,
      createdAt: new Date().toISOString(),
      colorDisplay: data.colorDisplay
    };

    const processedData = {
      ...todoData,
      userId,
      typeId: typeId === 'all' || typeId === '' ? null : typeId,
      categoryId: categoryId === 'all' || categoryId === '' ? null : categoryId
    };

    const tempId = crypto.randomUUID();
    const optimisticTodo = {
      ...newTodo,
      id: tempId,
      typeId: processedData.typeId,
      categoryId: processedData.categoryId,
      labels: labels || [],
      type: types.find(t => t.id === processedData.typeId),
      category: categories.find(c => c.id === processedData.categoryId)
    } as Todo;

    const createOptimisticNested = (items: TemplateItem[], parentId: string): Todo[] => {
      return items.flatMap(item => {
        const tempId = crypto.randomUUID();
        const todo = {
          id: tempId,
          userId,
          parentId,
          title: item.title,
          createdAt: new Date().toISOString()
        } as Todo;

        return [
          todo,
          ...(item.children ? createOptimisticNested(item.children, tempId) : [])
        ];
      });
    };

    const optimisticNested = createOptimisticNested(templateItems, tempId);
    const previousTodos = [...todos];

    setTodos(prev => [...prev, optimisticTodo, ...optimisticNested]);

    const operation = async () => {
      const { data: createdTodoData, error: todoError } = await supabase
        .from('todos')
        .insert([toSnakeCase(processedData)])
        .select(`
          *,
          type:types!left(id, name, color),
          category:categories!left(id, name, color)
        `)
        .single();

      if (todoError) throw todoError;

      if (labels?.length) {
        const labelRecords = labels.map(label => ({
          todo_id: createdTodoData.id,
          label_id: label.id
        }));
        await supabase.from('todo_labels').insert(labelRecords);
      }

      const createdNested = await createNestedTodos(
        templateItems,
        createdTodoData.id,
        userId
      );

      const mainTodo = {
        ...toCamelCase(createdTodoData),
        labels: labels || []
      } as Todo;

      setTodos(prev => [
        ...prev.filter(t => t.id !== tempId && !optimisticNested.find(n => n.id === t.id)),
        mainTodo,
        ...createdNested
      ]);

      return mainTodo;
    };

    return optimisticUpdate(operation, previousTodos, optimisticTodo);
  }, [createNestedTodos, optimisticUpdate, todos, types, categories, userId]);

  const updateTodo = useCallback(async (id: string, data: Partial<Todo>): Promise<Todo> => {
    const { labels, typeId, categoryId, ...todoData } = data;
    const existingTodo = todos.find(t => t.id === id);

    if (!existingTodo) {
      throw new Error('Todo not found');
    }

    const processedData = {
      ...todoData,
      typeId: typeId === 'all' || typeId === '' ? null : typeId,
      categoryId: categoryId === 'all' || categoryId === '' ? null : categoryId,
      colorDisplay: data.colorDisplay
    };

    const optimisticTodo = {
      ...existingTodo,
      ...todoData,
      typeId: processedData.typeId,
      categoryId: processedData.categoryId,
      labels: labels ?? existingTodo.labels,
      type: types.find(t => t.id === processedData.typeId) || existingTodo.type,
      category: categories.find(c => c.id === processedData.categoryId) || existingTodo.category
    } as Todo;

    const previousTodos = [...todos];
    setTodos(prev => prev.map(t => t.id === id ? optimisticTodo : t));

    const operation = async () => {
      const { data: updatedTodoData, error: todoError } = await supabase
        .from('todos')
        .update(toSnakeCase(processedData))
        .eq('id', id)
        .select(`
          *,
          type:types!left(id, name, color),
          category:categories!left(id, name, color)
        `)
        .single();

      if (todoError) throw todoError;

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
        ...toCamelCase(updatedTodoData),
        labels: labels ?? existingTodo.labels
      } as Todo;
    };

    return optimisticUpdate(operation, previousTodos, optimisticTodo);
  }, [optimisticUpdate, todos, types, categories]);

  const archiveTodo = useCallback(async (id: string): Promise<void> => {
    const previousTodos = [...todos];
    const tempTodo = todos.find(t => t.id === id);
    const updatedTodo = { ...tempTodo!, archivedAt: new Date().toISOString() };

    setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));

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

    await optimisticUpdate(operation, previousTodos, updatedTodo);
  }, [optimisticUpdate, todos]);

  const restoreTodo = useCallback(async (id: string) => {
    const previousTodos = [...todos];
    const tempTodo = todos.find(t => t.id === id)!;
    const updatedTodo = { ...tempTodo, archivedAt: null, deletedAt: null };
    setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));

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

    await optimisticUpdate(operation, previousTodos, updatedTodo);
  }, [optimisticUpdate, todos]);

  const softDeleteTodo = useCallback(async (id: string) => {
    const previousTodos = [...todos];
    const tempTodo = todos.find(t => t.id === id)!;
    const updatedTodo = { ...tempTodo, deletedAt: new Date().toISOString() };
    setTodos(prev => prev.filter(t => t.id !== id));

    const operation = async () => {
      await supabase
        .from('todos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    };

    await optimisticUpdate(operation, previousTodos, updatedTodo);
  }, [optimisticUpdate, todos]);

  const hardDeleteTodo = useCallback(async (id: string) => {
    const previousTodos = [...todos];
    const tempTodo = todos.find(t => t.id === id)!;
    setTodos(prev => prev.filter(t => t.id !== id));

    const operation = async () => {
      await supabase.from('todos').delete().eq('id', id);
    };

    await optimisticUpdate(operation, previousTodos, tempTodo);
  }, [optimisticUpdate, todos]);

  const bulkArchiveTodos = useCallback(async (ids: string[]) => {
    const previousTodos = [...todos];
    const tempTodo = todos.find(t => t.id === ids[0])!;
    const updatedTodo = { ...tempTodo, archivedAt: new Date().toISOString() };
    setTodos(prev => prev.map(t =>
      ids.includes(t.id) ? { ...t, archivedAt: new Date().toISOString() } : t
    ));

    const operation = async () => {
      await supabase
        .from('todos')
        .update({ archived_at: new Date().toISOString() })
        .in('id', ids);
    };

    await optimisticUpdate(operation, previousTodos, updatedTodo);
  }, [optimisticUpdate, todos]);

  const bulkDeleteTodos = useCallback(async (ids: string[], hardDelete = false) => {
    const previousTodos = [...todos];
    const tempTodo = todos.find(t => t.id === ids[0])!;
    const updatedTodo = { ...tempTodo, deletedAt: new Date().toISOString() };
    setTodos(prev => prev.filter(t => !ids.includes(t.id)));

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

    await optimisticUpdate(operation, previousTodos, updatedTodo);
  }, [optimisticUpdate, todos]);

  const setViewOptionsCallback = useCallback((options: Partial<ViewOptions>) =>
    setViewOptions(prev => ({ ...prev, ...options })), []);

  const setFilterOptionsCallback = useCallback((options: Partial<FilterOptions>) =>
    setFilterOptions(prev => ({ ...prev, ...options })), []);

  const setItemOptionsCallback = useCallback((options: Partial<ItemOptions>) =>
    setItemOptions(prev => ({ ...prev, ...options })), []);

  const value = {
    selectedColor,
    setSelectedColor,
    todos,
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
    createTodo,
    createFromTemplate,
    updateTodo,
    archiveTodo,
    restoreTodo,
    softDeleteTodo,
    hardDeleteTodo,
    bulkArchiveTodos,
    bulkDeleteTodos,
    refreshMetadata
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};