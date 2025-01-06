// contexts/MenuContext.tsx

'use client';

import { createContext, useContext, useCallback, useRef } from 'react';

interface MenuContextType {
  refreshMenu: () => void;
  registerRefreshHandler: (handler: () => void) => () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef(new Set<() => void>());

  const refreshMenu = useCallback(() => {
    handlersRef.current.forEach(handler => handler());
  }, []);

  const registerRefreshHandler = useCallback((handler: () => void) => {
    handlersRef.current.add(handler);
    return () => handlersRef.current.delete(handler);
  }, []);

  return (
    <MenuContext.Provider value={{ refreshMenu, registerRefreshHandler }}>
      {children}
    </MenuContext.Provider>
  );
}

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}