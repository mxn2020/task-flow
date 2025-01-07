// contexts/ScopesContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Scope } from '@/types';
import { toCamelCase } from '@/lib/utils';

interface ScopesContextType {
  systemScopes: Scope[];
  userScopes: Scope[];
  isLoading: boolean;
  error: Error | null;
  refreshScopes: () => Promise<void>;
}

interface InitialData {
  scopes: Scope[];
}

const ScopesContext = createContext<ScopesContextType | undefined>(undefined);

export function ScopesProvider({
  children,
  userId,
  initialData
}: {
  children: React.ReactNode;
  userId: string;
  initialData: InitialData;
}) {
  const [systemScopes, setSystemScopes] = useState<Scope[]>(
    initialData.scopes.filter(scope => scope.isSystem)
  );
  const [userScopes, setUserScopes] = useState<Scope[]>(
    initialData.scopes.filter(scope => !scope.isSystem)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshScopes = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const { data, error: scopesError } = await supabase
        .from('scopes')
        .select('*')
        .order('name')
        .is('deleted_at', null);    
      
      if (scopesError) throw scopesError;

      const parsedData = toCamelCase(data);
      setSystemScopes(parsedData.filter((scope: Scope) => scope.isSystem));
      setUserScopes(parsedData.filter((scope: Scope) => !scope.isSystem));

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const value = {
    systemScopes,
    userScopes,
    isLoading,
    error,
    refreshScopes
  };

  return (
    <ScopesContext.Provider value={value}>
      {children}
    </ScopesContext.Provider>
  );
}

export function useScopes() {
  const context = useContext(ScopesContext);
  if (!context) {
    throw new Error('useScopes must be used within a ScopesProvider');
  }
  return context;
}