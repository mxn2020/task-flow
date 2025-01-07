// hooks/useTemplates.ts
import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { SystemScopeType, Template, TemplateItem, Todo } from '@/types';
import { toSnakeCase, toCamelCase } from '@/lib/utils';

export function useTemplates() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
  }, []);

  const buildTemplateTree = (items: TemplateItem[]): TemplateItem[] => {
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
  };


  const flattenTemplateItems = (
    items: TemplateItem[],
    templateId: string,
    parentId: string | null = null,
    sortOrder: number = 0
  ): any[] => {
    let result: any[] = [];

    items.forEach((item, index) => {
      const flatItem = {
        templateId,
        parentId,
        title: item.title,
        sortOrder: sortOrder + index
      };

      result.push(flatItem);

      if (item.children?.length) {
        result = result.concat(
          flattenTemplateItems(
            item.children,
            templateId,
            item.id,
            sortOrder + items.length + index
          )
        );
      }
    });

    return result;
  };

  const saveTemplate = useCallback(async (template: Template) => {
    if (!userId) return;

    try {
      const templateData = {
        ...template,
        userId,
        items: undefined
      };

      const { data: savedTemplate, error: templateError } = await supabase
        .from('templates')
        .insert([toSnakeCase(templateData)])
        .select()
        .single();

      if (templateError) throw templateError;

      const itemsToSave = flattenTemplateItems(template.items, savedTemplate.id);
      const { error: itemsError } = await supabase
        .from('template_items')
        .insert(toSnakeCase(itemsToSave));

      if (itemsError) throw itemsError;

      await fetchTemplates();
      return savedTemplate;
    } catch (err) {
      setError(err as Error);
    }
  }, [userId, fetchTemplates, flattenTemplateItems]);


  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    expandTemplate,
    saveTemplate,
  };
}