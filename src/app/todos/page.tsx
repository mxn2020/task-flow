// app/todos/page.tsx
'use client';

import { useEffect } from 'react';
import { ScopeItemSystemContainer } from '@/components/task/ScopeItemSystemContainer';
import { useTodos } from '@/hooks/useTodos';

export default function TodoPage() {
  const {
    todos,
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
    createTodo,
    updateTodo,
    archiveTodo,
    softDeleteTodo,
    refreshMetadata,
  } = useTodos();

  useEffect(() => {
    refreshMetadata();
  }, [refreshMetadata]);

  return (
    <ScopeItemSystemContainer
      scopeType="todo"
      baseProps={{
        items: todos,
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
        onItemCreate: createTodo,
        onItemUpdate: updateTodo,
        onItemArchive: archiveTodo,
        onItemDelete: softDeleteTodo,
      }}
    />
  );
}