// components/app/NotificationSettings.tsx

import React, { useState, useEffect } from 'react';
import { Bell, Volume2, Globe, Phone, Clock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import timezones from 'timezones-list';

export function NotificationSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    soundEnabled: true,
    pushEnabled: true,
    browserEnabled: true,
    firstReminderTime: '1440', // 24 hours in minutes
    secondReminderTime: '60',  // 1 hour in minutes
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  const [pushPermission, setPushPermission] = useState('default');

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
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  };

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted') {
        // Register service worker and subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        // Send subscription to backend
        await fetch('/api/notifications/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        toast({
          title: "Push Notifications Enabled",
          description: "You'll now receive push notifications for important updates."
        });
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Your notification preferences have been updated."
        });
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
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
                />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Push Notifications</span>
                </div>
                {pushPermission === 'default' ? (
                  <Button onClick={requestPushPermission} variant="outline" size="sm">
                    Enable Push
                  </Button>
                ) : (
                  <Switch
                    checked={settings.pushEnabled && pushPermission === 'granted'}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, pushEnabled: checked }))
                    }
                    disabled={pushPermission !== 'granted'}
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

        <Button onClick={handleSaveSettings} className="w-full">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}