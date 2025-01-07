// app/scopes/[scopeSlug]/page.tsx
import { ScopePageClient } from './components/ScopePageClient';

export default async function ScopePage({
  params,
}: {
  params: Promise<{ scopeSlug: string }>;
}) {
  const { scopeSlug } = await params;
  return <ScopePageClient scopeSlug={scopeSlug} />;
}

