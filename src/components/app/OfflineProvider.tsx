// components/app/OfflineProvider.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SyncStatus } from './SyncStatus';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface OfflineContextType {
  isOffline: boolean;
  lastSync: Date | null;
  syncError: string | null;
  syncErrorDetails?: string;
}

const OfflineContext = createContext<OfflineContextType>({
  isOffline: false,
  lastSync: null,
  syncError: null
});

export const useOffline = () => useContext(OfflineContext);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OfflineContextType>({
    isOffline: !navigator.onLine,
    lastSync: null,
    syncError: null
  });
  const [showStatus, setShowStatus] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  useEffect(() => {
    let statusTimeout: NodeJS.Timeout;

    const updateNetworkStatus = (isOffline: boolean) => {
      setState(prev => ({ ...prev, isOffline }));
      setShowStatus(true);
      clearTimeout(statusTimeout);
      statusTimeout = setTimeout(() => setShowStatus(false), 5000);
    };

    const handleOnline = () => {
      updateNetworkStatus(false);
      checkSync();
    };
    
    const handleOffline = () => updateNetworkStatus(true);

    const checkSync = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Health check failed');
        }

        // Reset any previous sync errors
        setState(prev => ({ 
          ...prev, 
          lastSync: new Date(), 
          syncError: null,
          syncErrorDetails: undefined
        }));
        setShowErrorAlert(false);
      } catch (err) {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Unexpected sync error';

        setState(prev => ({
          ...prev,
          syncError: 'Sync failed',
          syncErrorDetails: errorMessage,
          lastSync: null
        }));

        // Show error alert
        setShowErrorAlert(true);

        // Dispatch custom event for broader error handling
        window.dispatchEvent(new CustomEvent('sync-error', {
          detail: { 
            message: 'Sync failed', 
            details: errorMessage 
          }
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync check
    checkSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(statusTimeout);
    };
  }, []);

  return (
    <OfflineContext.Provider value={state}>
      {children}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-44 md:bottom-24 left-4 bg-secondary/10 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-40"
            role="status"
            aria-live="polite"
          >
            {state.isOffline ? (
              <>
                <WifiOff className="w-4 h-4 text-destructive" />
                <span>Offline Mode</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-primary" />
                <span>Online</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showErrorAlert && state.syncError && state.syncErrorDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Alert variant="destructive" className="w-72">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertTitle>Sync Error</AlertTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-1"
                  onClick={() => setShowErrorAlert(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AlertDescription className="line-clamp-2 overflow-hidden text-ellipsis">
                {state.syncError}: {state.syncErrorDetails}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      <SyncStatus lastSync={state.lastSync} />
    </OfflineContext.Provider>
  );
}