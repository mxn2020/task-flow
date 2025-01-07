// components/app/NotificationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Bell, Volume2, Globe, Phone, Clock, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import timezones from 'timezones-list';

interface NotificationSettings {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  pushEnabled: boolean;
  browserEnabled: boolean;
  firstReminderTime: string;
  secondReminderTime: string;
  timezone: string;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: true,
    soundEnabled: true,
    pushEnabled: true,
    browserEnabled: true,
    firstReminderTime: '1440', // 24 hours in minutes
    secondReminderTime: '60',  // 1 hour in minutes
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load user settings
    loadUserSettings();
    
    // Check push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to load notification settings');
      }
      
      const data = await response.json();
      setSettings(data);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unexpected error loading settings';
      
      console.error('Failed to load notification settings:', error);
      setError(errorMessage);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        // Check for service worker support
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service workers are not supported');
        }

        // Register service worker and subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
        });
        
        // Send subscription to backend
        const response = await fetch('/api/notifications/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to register push subscription');
        }
        
        toast({
          title: "Push Notifications Enabled",
          description: "You'll now receive push notifications for important updates."
        });
      } else if (permission === 'denied') {
        toast({
          title: "Permission Denied",
          description: "Push notifications have been blocked. Please enable them in your browser settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unexpected error enabling push notifications';
      
      console.error('Push notification setup failed:', error);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to save notification settings');
      }
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated."
      });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unexpected error saving settings';
      
      console.error('Failed to save notification settings:', error);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Utility function to convert VAPID public key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      
      {error && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <CardContent className="space-y-6">
        {/* General Notifications Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Enable Notifications</label>
            <p className="text-sm text-muted-foreground">
              Receive notifications for reminders and updates
            </p>
          </div>
          <Switch
            checked={settings.notificationsEnabled}
            onCheckedChange={(checked) =>
              setSettings(prev => ({ ...prev, notificationsEnabled: checked }))
            }
            disabled={isLoading}
          />
        </div>

        {settings.notificationsEnabled && (
          <>
            {/* Notification Types */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Notification Types</h3>
              
              {/* Sound Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Sound Alerts</span>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, soundEnabled: checked }))
                  }
                  disabled={isLoading}
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Push Notifications</span>
                </div>
                {pushPermission === 'default' ? (
                  <Button 
                    onClick={requestPushPermission} 
                    variant="outline" 
                    size="sm"
                    disabled={isLoading}
                  >
                    Enable Push
                  </Button>
                ) : (
                  <Switch
                    checked={settings.pushEnabled && pushPermission === 'granted'}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, pushEnabled: checked }))
                    }
                    disabled={pushPermission !== 'granted' || isLoading}
                  />
                )}
              </div>

              {/* Browser Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Browser Notifications</span>
                </div>
                <Switch
                  checked={settings.browserEnabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, browserEnabled: checked }))
                  }
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Reminder Times */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Default Reminder Times</h3>
              
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm">First Reminder</label>
                  <Select
                    value={settings.firstReminderTime}
                    onValueChange={(value) =>
                      setSettings(prev => ({ ...prev, firstReminderTime: value }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10080">1 week before</SelectItem>
                      <SelectItem value="4320">3 days before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                      <SelectItem value="720">12 hours before</SelectItem>
                      <SelectItem value="360">6 hours before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Second Reminder</label>
                  <Select
                    value={settings.secondReminderTime}
                    onValueChange={(value) =>
                      setSettings(prev => ({ ...prev, secondReminderTime: value }))
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1440">1 day before</SelectItem>
                      <SelectItem value="360">6 hours before</SelectItem>
                      <SelectItem value="180">3 hours before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Timezone Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <label className="text-sm font-medium">Timezone</label>
              </div>
              <Select
                value={settings.timezone}
                onValueChange={(value) =>
                  setSettings(prev => ({ ...prev, timezone: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.tzCode} value={tz.tzCode}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <Button 
          onClick={handleSaveSettings} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}