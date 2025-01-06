// context/notification-context.tsx

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface NotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
  browserEnabled: boolean;
  firstReminderTime: string;
  secondReminderTime: string;
  timezone: string;
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  requestPushPermission: () => Promise<void>;
  showNotification: (title: string, message: string, options?: any) => void;
}

const defaultSettings: NotificationSettings = {
  notificationsEnabled: true,
  soundEnabled: true,
  pushEnabled: true,
  browserEnabled: true,
  firstReminderTime: '1440',
  secondReminderTime: '60',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [notificationSound, setNotificationSound] = useState<AudioBuffer | null>(null);

  useEffect(() => {
    if (session?.user) {
      loadSettings();
      initializeAudio();
    }
  }, [session]);

  const initializeAudio = async () => {
    try {
      const context = new AudioContext();
      const response = await fetch('/notification.mp3');
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      
      setAudioContext(context);
      setNotificationSound(audioBuffer);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });

      if (response.ok) {
        setSettings(updatedSettings);
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        await fetch('/api/notifications/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });

        await updateSettings({ pushEnabled: true });
      }
    }
  };

  const playNotificationSound = async () => {
    if (settings.soundEnabled && audioContext && notificationSound) {
      const source = audioContext.createBufferSource();
      source.buffer = notificationSound;
      source.connect(audioContext.destination);
      source.start();
    }
  };

  const showNotification = async (title: string, message: string, options: any = {}) => {
    if (!settings.notificationsEnabled) return;

    // Play sound if enabled
    if (settings.soundEnabled) {
      await playNotificationSound();
    }

    // Show browser notification if enabled and tab is inactive
    if (settings.browserEnabled && document.hidden) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          ...options
        });
      }
    }

    // Store in notification history
    await fetch('/api/notifications/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        ...options
      })
    });
  };

  const value = {
    settings,
    updateSettings,
    requestPushPermission,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}