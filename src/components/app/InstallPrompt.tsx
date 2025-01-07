// components/app/InstallPrompt.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

type Platform = 'ios' | 'android' | 'macos' | 'windows' | 'unknown';

interface InstallationState {
  showPrompt: boolean;
  platform: Platform;
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalling: boolean;
  installable: boolean;
  error: string | null;
}

export const InstallPrompt = () => {
  const [state, setState] = useState<InstallationState>({
    showPrompt: false,
    platform: 'unknown',
    deferredPrompt: null,
    isInstalling: false,
    installable: false,
    error: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone || 
                          document.referrer.includes('android-app://');

      window.matchMedia('(display-mode: standalone)').addEventListener('change', (evt) => {
        console.log('Display mode changed:', evt.matches ? 'standalone' : 'browser');
      });

      const userAgent = window.navigator.userAgent.toLowerCase();
      const platform: Platform = /(ipad|iphone|ipod)/.test(userAgent) ? 'ios'
        : /android/.test(userAgent) ? 'android'
        : /macintosh/.test(userAgent) ? 'macos'
        : /windows/.test(userAgent) ? 'windows'
        : 'unknown';

      setState(prev => ({ ...prev, platform }));
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Failed to initialize PWA detection'
      }));
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      setState(prev => ({
        ...prev,
        deferredPrompt: e,
        installable: true,
        showPrompt: true,
      }));
    };

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        showPrompt: false,
        deferredPrompt: null,
        installable: false,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const { deferredPrompt, isInstalling } = state;
    if (!deferredPrompt || isInstalling) return;

    setState(prev => ({ ...prev, isInstalling: true }));

    try {
      const promptEvent = deferredPrompt;
      setState(prev => ({ ...prev, deferredPrompt: null }));

      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;

      if (choiceResult.outcome === 'accepted') {
        setState(prev => ({ ...prev, showPrompt: false }));
      } else {
        setState(prev => ({ ...prev, deferredPrompt: promptEvent }));
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        error: err instanceof Error ? err.message : 'Installation failed',
        deferredPrompt: state.deferredPrompt 
      }));
    } finally {
      setState(prev => ({ ...prev, isInstalling: false }));
    }
  };

  if (!state.showPrompt || (!state.installable && state.platform !== 'ios')) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-md p-6 rounded-lg shadow-xl bg-white dark:bg-gray-800 space-y-4">
        <button
          onClick={() => setState(prev => ({ ...prev, showPrompt: false }))}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Install NextStack Pro
        </h2>

        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        <div className="text-gray-600 dark:text-gray-300">
          {state.platform === 'ios' ? (
            <div className="space-y-4">
              <p>To install this app on your iOS device:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Tap the Share button <span className="inline-block px-2">⎙</span></li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          ) : (
            <p>Install NextStack Pro for quick and easy access to your tasks and brainstorms.</p>
          )}
        </div>

        {state.platform === 'macos' && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keyboard shortcut: ⌘ + D
          </p>
        )}

        {state.platform !== 'ios' && (
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, showPrompt: false }))}
            >
              Later
            </Button>
            <Button
              onClick={handleInstall}
              disabled={state.isInstalling || !state.deferredPrompt}
            >
              {state.isInstalling ? 'Installing...' : 'Install'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallPrompt;