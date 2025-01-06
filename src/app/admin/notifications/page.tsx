// app/admin/notifications/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2 } from 'lucide-react';

type ScheduledNotification = {
  id: string;
  title: string;
  message: string;
  schedule_type: 'daily' | 'weekly' | 'monthly';
  schedule_time: string;
  schedule_day?: number;
  variables: string[];
  is_active: boolean;
};

export default function AdminNotificationsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [newNotification, setNewNotification] = useState<Partial<ScheduledNotification>>({
    schedule_type: 'daily',
    schedule_time: '09:00',
    is_active: true,
    variables: []
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/scheduled-notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      const response = await fetch('/api/admin/scheduled-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Scheduled notification created'
        });
        loadNotifications();
        setNewNotification({
          schedule_type: 'daily',
          schedule_time: '09:00',
          is_active: true,
          variables: []
        });
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to create notification',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/scheduled-notifications/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification deleted'
        });
        loadNotifications();
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/scheduled-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Notification ${isActive ? 'activated' : 'deactivated'}`
        });
        loadNotifications();
      }
    } catch (error) {
      console.error('Failed to update notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to update notification',
        variant: 'destructive'
      });
    }
  };

  if (!session?.user?.email) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Scheduled Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={newNotification.title || ''}
              onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={newNotification.message || ''}
              onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message"
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Available variables: {'{todoCount}, {brainstormCount}'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Schedule Type</label>
              <Select
                value={newNotification.schedule_type}
                onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                  setNewNotification(prev => ({ ...prev, schedule_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={newNotification.schedule_time || '09:00'}
                onChange={(e) => setNewNotification(prev => ({ ...prev, schedule_time: e.target.value }))}
              />
            </div>

            {newNotification.schedule_type === 'weekly' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Week</label>
                <Select
                  value={String(newNotification.schedule_day || 1)}
                  onValueChange={(value) => 
                    setNewNotification(prev => ({ ...prev, schedule_day: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="7">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {newNotification.schedule_type === 'monthly' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Day of Month</label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={newNotification.schedule_day || 1}
                  onChange={(e) => setNewNotification(prev => ({ 
                    ...prev, 
                    schedule_day: parseInt(e.target.value) 
                  }))}
                />
              </div>
            )}
          </div>

          <Button onClick={handleCreateNotification} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Scheduled Notification
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Notifications</h2>
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {notification.schedule_type === 'daily' && 'Daily'}
                      {notification.schedule_type === 'weekly' && `Weekly on day ${notification.schedule_day}`}
                      {notification.schedule_type === 'monthly' && `Monthly on day ${notification.schedule_day}`}
                      {' at '}
                      {notification.schedule_time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={notification.is_active}
                    onCheckedChange={(checked) => handleToggleActive(notification.id, checked)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}