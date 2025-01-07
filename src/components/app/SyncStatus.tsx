// components/app/SyncStatus.tsx

'use client';

import { Loader2, AlertCircle, CheckCircle, CloudOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SyncStatusProps {
  lastSync: Date | null;
}

type SyncState = {
  show: boolean;
  message: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: string | null;
  errorDetails?: string;
};

declare global {
  interface WindowEventMap {
    'sync-start': CustomEvent;
    'sync-complete': CustomEvent;
    'sync-error': CustomEvent<{ message: string; details?: string }>;
  }
}

export function SyncStatus({ lastSync }: SyncStatusProps) {
  const [syncState, setSyncState] = useState<SyncState>({
    show: false,
    message: '',
    status: 'idle',
    lastSyncTime: lastSync?.toLocaleTimeString() || null
  });
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const updateSyncState = (newState: Partial<SyncState>, hideDelay?: number) => {
      setSyncState(prev => ({ ...prev, ...newState }));
      if (hideDelay) {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          setSyncState(prev => ({ ...prev, show: false }));
        }, hideDelay);
      }
    };

    const handleSync = () => {
      updateSyncState({
        show: true,
        message: 'Syncing...',
        status: 'syncing'
      });
    };

    const handleSyncComplete = () => {
      const now = new Date();
      updateSyncState({
        show: true,
        message: 'Sync Complete',
        status: 'success',
        lastSyncTime: now.toLocaleTimeString()
      }, 3000);
    };

    const handleSyncError = (event: CustomEvent<{ message: string; details?: string }>) => {
      updateSyncState({
        show: true,
        message: event.detail.message || 'Sync failed',
        status: 'error',
        errorDetails: event.detail.details
      }, 5000);
      setShowErrorDetails(false);
    };

    window.addEventListener('sync-start', handleSync);
    window.addEventListener('sync-complete', handleSyncComplete);
    window.addEventListener('sync-error', handleSyncError as EventListener);

    return () => {
      window.removeEventListener('sync-start', handleSync);
      window.removeEventListener('sync-complete', handleSyncComplete);
      window.removeEventListener('sync-error', handleSyncError as EventListener);
      clearTimeout(hideTimeout);
    };
  }, []);

  useEffect(() => {
    if (lastSync) {
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: lastSync.toLocaleTimeString()
      }));
    }
  }, [lastSync]);

  return (
    <AnimatePresence>
      {syncState.show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed bottom-16 md:bottom-8 left-4 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50
            ${syncState.status === 'error' ? 'bg-destructive/10 text-destructive' : 
              syncState.status === 'success' ? 'bg-green-500/10 text-green-500' : 
              'bg-primary/10 text-primary'}`}
          role="status"
          aria-live="polite"
        >
          {syncState.status === 'syncing' && <Loader2 className="w-4 h-4 animate-spin" />}
          {syncState.status === 'error' && <AlertCircle className="w-4 h-4" />}
          {syncState.status === 'success' && <CheckCircle className="w-4 h-4" />}
          <span>
            {syncState.message}
            {syncState.lastSyncTime && syncState.status === 'success' && 
              ` at ${syncState.lastSyncTime}`}
          </span>
          {syncState.status === 'error' && syncState.errorDetails && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-1 ml-2"
              onClick={() => setShowErrorDetails(!showErrorDetails)}
            >
              <AlertCircle className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      )}
      
      {syncState.status === 'error' && syncState.errorDetails && showErrorDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 right-4 bg-destructive/10 text-destructive p-2 rounded-lg text-sm max-w-xs z-50"
          role="alert"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="line-clamp-2 overflow-hidden text-ellipsis">
                {syncState.errorDetails}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 p-1 -mr-1"
              onClick={() => setShowErrorDetails(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

