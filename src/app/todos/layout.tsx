// app/todos/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabaseClient';
import { ScopeProvider } from '@/contexts/ScopeContext';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { toCamelCase } from '@/lib/utils';
import { authOptions } from '@/lib/auth';
import { SystemScopeType } from '@/types';

async function fetchInitialData(userId: string) {
  const [
    scopeRes,
    itemsRes,
    typesRes,
    categoriesRes,
    labelsRes,
    groupsRes,
    templatesRes
  ] = await Promise.all([
    supabase
      .from('scopes')
      .select('*')
      .eq('name', 'todo' as SystemScopeType)
      .single(),
      supabase
      .from('todos')
      .select(`
        *,
        scope:scopes!todos_scope_id_fkey!inner (id, name, color, icon, slug),
        type:types!left(
          id, 
          name,
          color
        ),
        category:categories!left(
          id,
          name,
          color
        ),
        labels:todo_labels(
          label:labels(
            id,
            name,
            color
          )
        )
      `)
      .eq('user_id', userId)
      .eq('scope.name', 'todo')
      .is('deleted_at', null),
    supabase
      .from('types')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('labels')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('groups')
      .select('*')
      .eq('user_id', userId),
    supabase
      .from('templates')
      .select(`
        *,
        template_items(*)
      `)
      .eq('user_id', userId)
      .is('deleted_at', null)
  ]);

  const items = itemsRes.data?.map(item => ({
    ...item,
    labels: item.labels?.map(({ label }: any) => label)
  }));

  const templates = templatesRes.data?.map(template => ({
    ...template,
    items: toCamelCase(template.template_items || [])
  }));

  return {
    scope: toCamelCase(scopeRes.data!),
    items: toCamelCase(items || []),
    types: toCamelCase(typesRes.data || []),
    categories: toCamelCase(categoriesRes.data || []),
    labels: toCamelCase(labelsRes.data || []),
    groups: toCamelCase(groupsRes.data || []),
    templates: toCamelCase(templates || [])
  };
}

export default async function TodoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const initialData = await fetchInitialData(session.user.id);

  return (
    <TemplateProvider userId={session.user.id} initialData={{ templates: initialData.templates }}>
      <ScopeProvider
        userId={session.user.id}
        scopeId={initialData.scope.id}
        initialData={initialData}
      >
        {children}
      </ScopeProvider>
    </TemplateProvider>
  );
}