// app/templates/layout.tsx

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabaseClient';
import { TemplateProvider } from '@/contexts/TemplateContext';
import { ScopesProvider } from '@/contexts/ScopesContext';
import { toCamelCase } from '@/lib/utils';
import { authOptions } from '@/lib/auth';

async function fetchInitialData(userId: string) {
  const [templatesRes, scopesRes] = await Promise.all([
    supabase
      .from('templates')
      .select(`
        *,
        template_items(*)
      `)
      .eq('user_id', userId)
      .is('deleted_at', null),
    supabase
      .from('scopes')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .is('deleted_at', null)
  ]);

  const templates = templatesRes.data?.map(template => ({
    ...template,
    items: template.template_items || []
  }));

  return {
    templates: toCamelCase(templates || []),
    scopes: toCamelCase(scopesRes.data || [])
  };
}

export default async function TemplateLayout({
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
    <ScopesProvider userId={session.user.id} initialData={initialData}>
      <TemplateProvider userId={session.user.id} initialData={initialData}>
        {children}
      </TemplateProvider>
    </ScopesProvider>
  );
}

