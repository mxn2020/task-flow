'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncStatus } from './SyncStatus';

const OfflineContext = createContext({ isOffline: false });

export const useOffline = () => useContext(OfflineContext);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ isOffline }}>
      {children}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-20 md:bottom-4 left-4 bg-secondary/10 text-destructive px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
          >
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4" />
                Offline Mode
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                Online
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <SyncStatus />
    </OfflineContext.Provider>
  );
}