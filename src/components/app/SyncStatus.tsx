'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function SyncStatus() {
  const [showSync, setShowSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  useEffect(() => {
    const handleSync = () => {
      setSyncMessage('Syncing...');
      setShowSync(true);
      setTimeout(() => setShowSync(false), 5000);
    };

    const handleSyncComplete = () => {
      setSyncMessage('Sync Complete');
      setShowSync(true);
      setTimeout(() => setShowSync(false), 5000);
    };

    window.addEventListener('sync-start', handleSync);
    window.addEventListener('sync-complete', handleSyncComplete);

    return () => {
      window.removeEventListener('sync-start', handleSync);
      window.removeEventListener('sync-complete', handleSyncComplete);
    };
  }, []);

  return (
    <AnimatePresence>
      {showSync && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-32 md:bottom-16 left-4 bg-primary/10 text-primary px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          {syncMessage === 'Syncing...' && <Loader2 className="w-4 h-4 animate-spin" />}
          {syncMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
}