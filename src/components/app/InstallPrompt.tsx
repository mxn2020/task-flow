'use client'

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installable, setInstallable] = useState(false);

  // Debug PWA environment
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
    
    console.log('PWA Debug Info:', {
      isStandalone,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasBeforeInstallPrompt: 'BeforeInstallPromptEvent' in window,
      displayMode: window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser',
    });

    // Listen for PWA install status changes
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
      console.log('Display mode changed:', evt.matches ? 'standalone' : 'browser');
    });
  }, []);

  useEffect(() => {
    const detectPlatform = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      console.log('Detected platform:', userAgent);
      
      if (/(ipad|iphone|ipod)/.test(userAgent)) return 'ios';
      if (/android/.test(userAgent)) return 'android';
      if (/macintosh/.test(userAgent)) return 'macos';
      if (/windows/.test(userAgent)) return 'windows';
      return 'unknown';
    };
    
    setPlatform(detectPlatform());
  
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('beforeinstallprompt event captured');
      // Don't preventDefault() anymore
      setDeferredPrompt(e);
      setInstallable(true);
      setShowPrompt(true);
    };
  
    // Add the event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful installation
    window.addEventListener('appinstalled', (event) => {
      console.log('App was successfully installed');
      setShowPrompt(false);
      setDeferredPrompt(null);
      setInstallable(false);
    });
  
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  const handleInstall = async () => {
    console.log('Install button clicked', { deferredPrompt, isInstalling });
    
    if (!deferredPrompt || isInstalling) {
      console.log('No installation prompt available or already installing');
      return;
    }
    
    try {
      setIsInstalling(true);
      
      const promptEvent = deferredPrompt;
      setDeferredPrompt(null);

      console.log('Triggering install prompt...');
      await promptEvent.prompt();
      
      const choiceResult = await promptEvent.userChoice;
      console.log('User choice:', choiceResult.outcome);
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the installation');
        setShowPrompt(false);
      } else {
        console.log('User dismissed the installation');
        setDeferredPrompt(promptEvent);
      }
    } catch (error) {
      console.error('Installation error:', error);
      setDeferredPrompt(deferredPrompt);
    } finally {
      setIsInstalling(false);
    }
  };

  const InstallButton = () => (
    <Button
      onClick={handleInstall}
      disabled={isInstalling || !deferredPrompt}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 
        dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50"
    >
      {isInstalling ? 'Installing...' : 'Install'}
    </Button>
  );
  
  const IosInstructions = () => (
    <div className="space-y-4">
      <p>To install this app on your iOS device:</p>
      <ol className="list-decimal list-inside space-y-2">
        <li>Tap the Share button <span className="inline-block px-2">⎙</span></li>
        <li>Scroll and tap &ldquo;Add to Home Screen&rdquo;</li>
        <li>Tap &ldquo;Add&rdquo; to confirm</li>
      </ol>
    </div>
  );

  // Only show the prompt if it should be shown and the app is installable
  if (!showPrompt || (!installable && platform !== 'ios')) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md p-6 rounded-lg shadow-xl bg-white dark:bg-gray-800 space-y-4">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Install TaskFlow
        </h2>

        <div className="text-gray-600 dark:text-gray-300">
          {platform === 'ios' ? (
            <IosInstructions />
          ) : (
            <p>Install TaskFlow for quick and easy access to your tasks and brainstorms.</p>
          )}
        </div>

        {platform === 'macos' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keyboard shortcut: ⌘ + D
          </p>
        )}

        {platform !== 'ios' && (
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowPrompt(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
            >
              Later
            </Button>
            <InstallButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;