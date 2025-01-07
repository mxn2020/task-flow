// components/app/NotificationCenter.tsx

'use client'

import React, { useState, useEffect } from 'react';
import { Bell, Check, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  item_id?: string;
  scope_type?: string;
  read_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/notifications/history');
      if (!response.ok) throw new Error('Failed to load notifications');
      
      const data = await response.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read_at).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/history/${id}/read`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      const response = await fetch(`/api/notifications/history/${notification.id}/clicked`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark as clicked');

      if (notification.item_id && notification.scope_type) {
        setIsOpen(false);
        router.push(`/${notification.scope_type}/${notification.item_id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to handle notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/history/mark-all-read', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  const NotificationsList = () => (
    <ScrollArea className="h-[calc(100vh-5rem)] mt-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {isLoading ? 'Loading notifications...' : 'No notifications yet'}
          </p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read_at ? 'bg-muted' : 'bg-background'
              } ${notification.item_id ? 'cursor-pointer' : ''}`}
              onClick={() => notification.item_id && handleNotificationClick(notification)}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </div>
                </div>
                {!notification.read_at && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notification.id);
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex justify-between items-center">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                disabled={isLoading}
              >
                Mark all as read
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <NotificationsList />
      </SheetContent>
    </Sheet>
  );
}