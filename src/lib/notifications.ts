// lib/notifications.ts
import { supabase } from './supabaseClient';

export class NotificationManager {
  private static async getUserSettings(userId: string) {
    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return data;
  }

  private static async getItemSettings(itemId: string, scopeType: string) {
    const { data } = await supabase
      .from('item_notification_settings')
      .select('*')
      .eq('item_id', itemId)
      .eq('scope_type', scopeType)
      .single();
    
    return data;
  }

  static async scheduleItemNotifications(
    itemId: string,
    scopeType: string,
    userId: string,
    deadline: Date
  ) {
    const userSettings = await this.getUserSettings(userId);
    const itemSettings = await this.getItemSettings(itemId, scopeType);
    
    if (!userSettings?.notificationsEnabled) return;

    const settings = {
      ...userSettings,
      ...itemSettings
    };

    const notifications = [];

    // First reminder
    if (settings.firstReminderTime) {
      const firstReminderDate = new Date(deadline);
      firstReminderDate.setMinutes(
        firstReminderDate.getMinutes() - parseInt(settings.firstReminderTime)
      );

      notifications.push({
        user_id: userId,
        title: `First Reminder: ${scopeType} Due Soon`,
        message: `Your ${scopeType} is due in ${settings.firstReminderTime} minutes`,
        scheduled_for: firstReminderDate,
        notification_type: 'first_reminder',
        item_id: itemId,
        scope_type: scopeType
      });
    }

    // Second reminder
    if (settings.secondReminderTime) {
      const secondReminderDate = new Date(deadline);
      secondReminderDate.setMinutes(
        secondReminderDate.getMinutes() - parseInt(settings.secondReminderTime)
      );

      notifications.push({
        user_id: userId,
        title: `Final Reminder: ${scopeType} Due Soon`,
        message: `Your ${scopeType} is due in ${settings.secondReminderTime} minutes`,
        scheduled_for: secondReminderDate,
        notification_type: 'second_reminder',
        item_id: itemId,
        scope_type: scopeType
      });
    }

    // Deadline notification
    notifications.push({
      user_id: userId,
      title: `${scopeType} Deadline Reached`,
      message: `Your ${scopeType} is now due`,
      scheduled_for: deadline,
      notification_type: 'deadline',
      item_id: itemId,
      scope_type: scopeType
    });

    // Insert all notifications into queue
    await supabase
      .from('notification_queue')
      .insert(notifications);
  }

  static async sendNotification(
    userId: string,
    title: string,
    message: string,
    options: {
      itemId?: string;
      itemType?: string;
      scopeType?: string;
      url?: string;
      sound?: boolean;
    } = {}
  ) {
    const userSettings = await this.getUserSettings(userId);
    if (!userSettings?.notificationsEnabled) return;

    // Add to history
    await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        title,
        message,
        item_id: options.itemId,
        scope_type: options.scopeType,
        created_at: new Date().toISOString()
      });

    // Send push notification if enabled
    if (userSettings.pushEnabled) {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          message,
          soundEnabled: userSettings.soundEnabled,
          ...options
        })
      });
    }

    // Send browser notification if enabled and window is inactive
    if (userSettings.browserEnabled && document.hidden) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/icons/icon-192x192.png',
          tag: 'nextstackpro-notification'
        });
      }
    }

    // Play sound if enabled
    if (userSettings.soundEnabled) {
      const audio = new Audio('/notification.mp3');
      await audio.play();
    }
  }
}