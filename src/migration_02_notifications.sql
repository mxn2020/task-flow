-- Create notification settings table
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  first_reminder_time INTERVAL DEFAULT '1 day',
  second_reminder_time INTERVAL DEFAULT '1 hour',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Create item notification settings table
CREATE TABLE item_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  first_reminder_time INTERVAL,
  second_reminder_time INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (item_id, item_type)
);

-- Create scheduled notifications table
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  schedule_time TIME NOT NULL,
  schedule_day INT, -- day of week (1-7) for weekly, day of month (1-31) for monthly
  variables JSONB, -- Store dynamic variables
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create notification queue table
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  notification_type TEXT NOT NULL, -- 'deadline', 'first_reminder', 'second_reminder', 'scheduled'
  item_id UUID,
  item_type TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add superadmin field to profiles
ALTER TABLE profiles ADD COLUMN is_superadmin BOOLEAN DEFAULT false;


CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, endpoint)
);

-- Add timezone to user settings
ALTER TABLE profiles ADD COLUMN timezone TEXT DEFAULT 'UTC';

-- Add notification preferences
ALTER TABLE notification_settings ADD COLUMN sound_enabled BOOLEAN DEFAULT true;
ALTER TABLE notification_settings ADD COLUMN push_enabled BOOLEAN DEFAULT true;
ALTER TABLE notification_settings ADD COLUMN browser_enabled BOOLEAN DEFAULT true;

-- Create notification history
CREATE TABLE notification_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  item_id UUID,
  item_type TEXT,
  read_at TIMESTAMP,
  clicked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Remove item-specific tables in favor of scope-based approach
DROP TABLE IF EXISTS item_notification_settings;

-- Update notification settings for scopes
CREATE TABLE scope_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope_id UUID REFERENCES scopes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  first_reminder_time INTERVAL,
  second_reminder_time INTERVAL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (scope_id, user_id)
);

-- Update notification queue for scope-based items
ALTER TABLE notification_queue
DROP COLUMN item_type,
ADD COLUMN scope_id UUID REFERENCES scopes(id),
ALTER COLUMN notification_type TYPE TEXT; -- Allow any notification type based on scope

-- Update notification history for scope-based items
ALTER TABLE notification_history
DROP COLUMN item_type,
ADD COLUMN scope_id UUID REFERENCES scopes(id),
ALTER COLUMN notification_type TYPE TEXT;

