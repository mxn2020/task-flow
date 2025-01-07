'use client'

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SystemScopeType, Template, TemplateItem } from '@/types';
import { toCamelCase, toSnakeCase } from '@/lib/utils';

interface TemplateContextType {
  templates: Template[];
  isLoading: boolean;
  error: Error | null;
  fetchTemplates: (scopeType?: SystemScopeType | string) => Promise<void>;
  expandTemplate: (templateId: string) => Promise<TemplateItem[]>;
  createTemplate: (data: Partial<Template>) => Promise<Template>;
  updateTemplate: (id: string, data: Partial<Template>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  archiveTemplate: (id: string) => Promise<void>;
  restoreTemplate: (id: string) => Promise<void>;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

interface InitialData {
  templates: Template[];
}

export function TemplateProvider({
  children,
  userId,
  initialData
}: {
  children: React.ReactNode;
  userId: string;
  initialData: InitialData;
}) {
  const [templates, setTemplates] = useState<Template[]>(initialData.templates);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const optimisticUpdate = useCallback(async <T,>(
    operation: () => Promise<T>,
    rollbackData: Template[],
    tempTemplate: Template
  ): Promise<T> => {
    try {
      const result = await operation();
      setTemplates(prev => prev.map(template => 
        template.id === tempTemplate.id ? result as Template : template
      ));
      return result;
    } catch (err) {
      setTemplates(rollbackData);
      setError(err as Error);
      throw err;
    }
  }, []);

  const fetchTemplates = useCallback(async (scopeType?: SystemScopeType | string) => {
    if (!userId) return;
    setIsLoading(true);
  
    try {
      let query = supabase
        .from('templates')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null);
  
      if (scopeType) {
        query = query.eq('scope_type', scopeType);
      }
  
      const { data, error } = await query;
      if (error) throw error;
      
      setTemplates(toCamelCase(data));
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const buildTemplateTree = useCallback((items: TemplateItem[]): TemplateItem[] => {
    const itemMap = new Map<string, TemplateItem>();
    const roots: TemplateItem[] = [];

    items.forEach(item => {
      itemMap.set(item.id!, { ...item, children: [] });
    });

    items.forEach(item => {
      const node = itemMap.get(item.id!);
      if (node) {
        if (item.parentId) {
          const parent = itemMap.get(item.parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          roots.push(node);
        }
      }
    });

    return roots;
  }, []);

  const expandTemplate = useCallback(async (templateId: string): Promise<TemplateItem[]> => {
    try {
      const { data, error } = await supabase
        .from('template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return buildTemplateTree(toCamelCase(data));
    } catch (err) {
      setError(err as Error);
      return [];
    }
  }, [buildTemplateTree]);

  const flattenTemplateItems = useCallback((
    items: TemplateItem[],
    templateId: string,
    parentId: string | null = null,
    sortOrder: number = 0
  ): any[] => {
    let result: any[] = [];
  
    items.forEach((item, index) => {
      // Create new item with temporary ID if none exists
      const itemId = item.id || crypto.randomUUID();
      
      const flatItem = {
        id: itemId,
        template_id: templateId,
        parent_id: parentId,
        title: item.title,
        sort_order: sortOrder + index
      };
  
      result.push(flatItem);
  
      if (item.children?.length) {
        result = result.concat(
          flattenTemplateItems(
            item.children,
            templateId,
            itemId, // Use the current item's ID as parent
            sortOrder + items.length + index
          )
        );
      }
    });
  
    return result;
  }, []);

  const createTemplate = useCallback(async (data: Partial<Template>): Promise<Template> => {
    const { items, ...templateData } = data;
    const newTemplate = {
      ...templateData,
      userId,
      createdAt: new Date().toISOString()
    };

    const tempId = crypto.randomUUID();
    const optimisticTemplate = {
      ...newTemplate,
      id: tempId,
      items: items || []
    } as Template;

    const previousTemplates = [...templates];
    setTemplates(prev => [...prev, optimisticTemplate]);

    const operation = async () => {
      const { data: createdTemplate, error: templateError } = await supabase
        .from('templates')
        .insert([toSnakeCase(newTemplate)])
        .select()
        .single();

      if (templateError) throw templateError;

      if (items?.length) {
        const flatItems = flattenTemplateItems(items, createdTemplate.id);
        const { error: itemsError } = await supabase
          .from('template_items')
          .insert(flatItems);

        if (itemsError) throw itemsError;
      }

      return {
        ...toCamelCase(createdTemplate),
        items: items || []
      } as Template;
    };

    return optimisticUpdate(operation, previousTemplates, optimisticTemplate);
  }, [optimisticUpdate, templates, userId, flattenTemplateItems]);

  const updateTemplate = useCallback(async (id: string, data: Partial<Template>): Promise<Template> => {
    const { items, ...templateData } = data;
    const existingTemplate = templates.find(t => t.id === id);

    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    const optimisticTemplate = {
      ...existingTemplate,
      ...templateData,
      items: items ?? existingTemplate.items
    } as Template;

    const previousTemplates = [...templates];
    setTemplates(prev => prev.map(t => t.id === id ? optimisticTemplate : t));

    const operation = async () => {
      const { data: updatedTemplate, error: templateError } = await supabase
        .from('templates')
        .update(toSnakeCase(templateData))
        .eq('id', id)
        .select()
        .single();

      if (templateError) throw templateError;

      if (items !== undefined) {
        await supabase.from('template_items').delete().eq('template_id', id);

        if (items.length > 0) {
          const flatItems = flattenTemplateItems(items, id);
          await supabase.from('template_items').insert(flatItems);
        }
      }

      return {
        ...toCamelCase(updatedTemplate),
        items: items ?? existingTemplate.items
      } as Template;
    };

    return optimisticUpdate(operation, previousTemplates, optimisticTemplate);
  }, [optimisticUpdate, templates, flattenTemplateItems]);

  const deleteTemplate = useCallback(async (id: string) => {
    const previousTemplates = [...templates];
    const tempTemplate = templates.find(t => t.id === id)!;
    const updatedTemplate = { ...tempTemplate, deletedAt: new Date().toISOString() };
    setTemplates(prev => prev.filter(t => t.id !== id));

    const operation = async () => {
      await supabase
        .from('templates')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
    };

    await optimisticUpdate(operation, previousTemplates, updatedTemplate);
  }, [optimisticUpdate, templates]);

  const archiveTemplate = useCallback(async (id: string) => {
    const previousTemplates = [...templates];
    const tempTemplate = templates.find(t => t.id === id)!;
    const updatedTemplate = { ...tempTemplate, archivedAt: new Date().toISOString() };
    
    setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
  
    const operation = async () => {
      const { data, error } = await supabase
        .from('templates')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return toCamelCase(data);
    };
  
    await optimisticUpdate(operation, previousTemplates, updatedTemplate);
  }, [optimisticUpdate, templates]);
  

  const restoreTemplate = useCallback(async (id: string) => {
    const previousTemplates = [...templates];
    const tempTemplate = templates.find(t => t.id === id)!;
    const updatedTemplate = { ...tempTemplate, archivedAt: null, deletedAt: null };
    setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));

    const operation = async () => {
      const { data, error } = await supabase
        .from('templates')
        .update({ archived_at: null })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      return toCamelCase(data);
    };

    await optimisticUpdate(operation, previousTemplates, updatedTemplate);
  }, [optimisticUpdate, templates]);

  const value = {
    templates,
    isLoading,
    error,
    fetchTemplates,
    expandTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    archiveTemplate,
    restoreTemplate
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export const useTemplates = () => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplateProvider');
  }
  return context;
};