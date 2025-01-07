-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, key)
);

-- Add a trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to initialize user settings
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert system scope positions
    INSERT INTO user_settings (user_id, key, value)
    VALUES (
        NEW.id,
        'system_scope_positions',
        json_build_object(
            'todo', 0,
            'brainstorm', 1,
            'note', 2,
            'checklist', 3,
            'milestone', 4,
            'resource', 5,
            'timeblock', 6,
            'event', 7,
            'bookmark', 8,
            'flow', 9
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profiles
CREATE TRIGGER create_user_settings_for_new_profile
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_settings();

-- Initialize system scope settings for existing users
INSERT INTO user_settings (user_id, key, value)
SELECT 
  p.id as user_id,
  'system_scope_positions' as key,
  json_build_object(
    'todo', 0,
    'brainstorm', 1,
    'note', 2,
    'checklist', 3,
    'milestone', 4,
    'resource', 5,
    'timeblock', 6,
    'event', 7,
    'bookmark', 8,
    'flow', 9
  ) as value
FROM profiles p
ON CONFLICT (user_id, key) DO NOTHING;