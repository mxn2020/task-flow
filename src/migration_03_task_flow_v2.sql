-- ========================================================
-- MIGRATION: COMPLETE SCHEMA & LOGIC IN ONE FILE
-- ========================================================

BEGIN;

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- GROUPS
-- =====================
CREATE TABLE IF NOT EXISTS groups (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  -- Core fields
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE groups 
  ADD CONSTRAINT unique_group_name_per_user 
  UNIQUE (user_id, name);

-- =====================
-- TYPES
-- =====================
CREATE TABLE IF NOT EXISTS types (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  -- Core fields
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- =====================
-- CATEGORIES
-- =====================
CREATE TABLE IF NOT EXISTS categories (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  -- Core fields
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- =====================
-- LABELS
-- =====================
CREATE TABLE IF NOT EXISTS labels (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  -- Core fields
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- =====================
-- TODOS
-- =====================
CREATE TABLE IF NOT EXISTS todos (
  -- Identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES todos (id) ON DELETE SET NULL,

  -- Basic details
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Type & Category
  type_id UUID REFERENCES types (id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  color_display TEXT DEFAULT 'none',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  archived_at TIMESTAMP,

  -- Extended features
  metadata JSONB DEFAULT '{}',
  priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5),
  is_urgent BOOLEAN DEFAULT false,
  importance_score INTEGER,
  started_at TIMESTAMP,
  paused_at TIMESTAMP,
  total_time_spent INTERVAL,
  estimated_duration INTERVAL,
  progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100),
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'blocked', 'review', 'done'))
    DEFAULT 'not_started',
  blocked_reason TEXT,
  checklist_items JSONB DEFAULT '[]',
  dependent_on UUID[],
  blocked_by UUID[],
  related_to UUID[],
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  repeat_pattern TEXT,
  location TEXT,
  is_private BOOLEAN DEFAULT false,
  shared_with UUID[],
  visibility_level TEXT CHECK (visibility_level IN ('private', 'shared', 'public')) 
    DEFAULT 'private',
  is_favorite BOOLEAN DEFAULT false
);

-- =====================
-- TODO_LABELS (Junction)
-- =====================
CREATE TABLE IF NOT EXISTS todo_labels (
  todo_id UUID REFERENCES todos (id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels (id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, label_id)
);

-- =====================
-- FUNCTION: initialize_user_data()
-- =====================
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO types (user_id, name, color) VALUES
    (NEW.user_id, 'Personal', '#3498db'),
    (NEW.user_id, 'Work', '#2ecc71'),
    (NEW.user_id, 'Study', '#e74c3c'),
    (NEW.user_id, 'Health', '#9b59b6'),
    (NEW.user_id, 'Finance', '#f1c40f');

  INSERT INTO categories (user_id, name, color) VALUES
    (NEW.user_id, 'Priority', '#f39c12'),
    (NEW.user_id, 'Routine', '#1abc9c'),
    (NEW.user_id, 'Long-term', '#9b59b6'),
    (NEW.user_id, 'Short-term', '#34495e'),
    (NEW.user_id, 'Project', '#e67e22');

  INSERT INTO labels (user_id, name, color) VALUES
    (NEW.user_id, 'Important', '#e74c3c'),
    (NEW.user_id, 'Urgent', '#f39c12'),
    (NEW.user_id, 'Optional', '#95a5a6'),
    (NEW.user_id, 'Personal Growth', '#3498db'),
    (NEW.user_id, 'Family', '#2ecc71'),
    (NEW.user_id, 'Friends', '#e74c3c'),
    (NEW.user_id, 'Learning', '#9b59b6'),
    (NEW.user_id, 'Career', '#f1c40f'),
    (NEW.user_id, 'Wellness', '#1abc9c'),
    (NEW.user_id, 'Hobby', '#e67e22'),
    (NEW.user_id, 'Financial', '#34495e'),
    (NEW.user_id, 'Creative', '#8e44ad');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- INDEXES (soft-delete & archive columns)
-- =====================
CREATE INDEX idx_todos_deleted_at ON todos(deleted_at);
CREATE INDEX idx_todos_archived_at ON todos(archived_at);

-- =====================
-- VIEWS
-- =====================
CREATE VIEW active_todos AS
SELECT * FROM todos
WHERE deleted_at IS NULL AND archived_at IS NULL;

CREATE VIEW archived_todos AS
SELECT * FROM todos
WHERE deleted_at IS NULL AND archived_at IS NOT NULL;

-- =====================
-- FUNCTIONS: soft delete, archive, unarchive
-- =====================
CREATE OR REPLACE FUNCTION soft_delete_todo(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE todos
    SET deleted_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION archive_todo(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE todos
    SET archived_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION unarchive_todo(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE todos
    SET archived_at = NULL
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TEMPLATES
-- =====================
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- =====================
-- TEMPLATE_ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES templates (id) ON DELETE CASCADE,
    parent_id UUID REFERENCES template_items (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sort_order INT DEFAULT 0
);

-- =====================
-- SCOPES
-- =====================
CREATE TABLE scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  metadata JSONB DEFAULT '{"fields": {}}',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Add scope_id to TODOS
ALTER TABLE todos 
  ADD COLUMN scope_id UUID REFERENCES scopes (id) ON DELETE SET NULL;

-- Insert built-in system scopes
INSERT INTO scopes (name, metadata, is_system) VALUES
('todo',       '{"fields": {}}', true),
('brainstorm', '{"fields": {"content": {"type": "text", "required": true}}}', true),
('note',       '{"fields": {"content": {"type": "text", "required": true}}, "ui": {"title_as_content": true}}', true),
('checklist',  '{"fields": {}}', true),
('milestone',  '{
   "fields": {
     "target_date": {"type": "date"},
     "success_criteria": {"type": "text[]"},
     "progress": {"type": "number"},
     "impact": {"type": "text"}
   }
}', true),
('resource',   '{
   "fields": {
     "url": {"type": "text"},
     "source": {"type": "text"},
     "format": {"type": "select", "options": ["article", "video", "book", "course"]},
     "tags": {"type": "text[]"}
   }
}', true),
('timeblock',  '{
   "fields": {
     "start_time": {"type": "timestamp"},
     "end_time": {"type": "timestamp"},
     "recurrence": {"type": "text"},
     "energy_level": {"type": "number"}
   }
}', true),
('event',      '{
   "fields": {
     "start": {"type": "timestamp"},
     "end": {"type": "timestamp"},
     "location": {"type": "text"},
     "attendees": {"type": "text[]"},
     "recurring": {"type": "boolean"}
   }
}', true),
('bookmark',   '{
   "fields": {
     "url": {"type": "text"},
     "favicon": {"type": "text"},
     "description": {"type": "text"},
     "tags": {"type": "text[]"},
     "last_visited": {"type": "timestamp"}
   }
}', true);

INSERT INTO scopes (name, metadata, is_system) VALUES
('flow', '{
  "fields": {
    "dependencies": {
      "type": "array",
      "items": {
        "item_id": "uuid",
        "dependency_type": "text",
        "condition": "jsonb"
      }
    },
    "status": {
      "type": "select",
      "options": ["pending", "ready", "blocked", "completed"]
    },
    "completion_criteria": {
      "type": "text"
    },
    "sub_dependencies": {
      "type": "jsonb"
    }
  }
}', true);

-- Default icons for system scopes
UPDATE scopes SET icon = 'CheckCircle'   WHERE name = 'todo'       AND is_system = true;
UPDATE scopes SET icon = 'Lightbulb'     WHERE name = 'brainstorm' AND is_system = true;
UPDATE scopes SET icon = 'StickyNote'    WHERE name = 'note'       AND is_system = true;
UPDATE scopes SET icon = 'ListChecks'    WHERE name = 'checklist'  AND is_system = true;
UPDATE scopes SET icon = 'Target'        WHERE name = 'milestone'  AND is_system = true;
UPDATE scopes SET icon = 'Book'          WHERE name = 'resource'   AND is_system = true;
UPDATE scopes SET icon = 'Calendar'      WHERE name = 'timeblock'  AND is_system = true;
UPDATE scopes SET icon = 'CalendarDays'  WHERE name = 'event'      AND is_system = true;
UPDATE scopes SET icon = 'Bookmark'      WHERE name = 'bookmark'   AND is_system = true;
UPDATE scopes SET icon = 'GitBranch'     WHERE name = 'flow'       AND is_system = true;

-- Add more columns to TEMPLATE_ITEMS
ALTER TABLE template_items
  ADD COLUMN scope_id UUID REFERENCES scopes(id),
  ADD COLUMN priority_level INTEGER,
  ADD COLUMN status TEXT,
  ADD COLUMN checklist_items JSONB,
  ADD COLUMN custom_fields JSONB,
  ADD COLUMN estimated_duration INTERVAL;

-- Add default_template_id to SCOPES
ALTER TABLE scopes
  ADD COLUMN default_template_id UUID REFERENCES templates(id),
  ADD COLUMN slug TEXT NOT NULL DEFAULT '',
  ADD COLUMN show_in_sidebar BOOLEAN DEFAULT true,
  ADD COLUMN deleted_at TIMESTAMP,
  ADD COLUMN archived_at TIMESTAMP,
  ADD COLUMN position INTEGER;

UPDATE scopes 
  SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));

ALTER TABLE scopes
  DROP CONSTRAINT IF EXISTS scopes_user_id_name_key,
  ADD CONSTRAINT scopes_user_id_name_key UNIQUE (user_id, name),
  ADD CONSTRAINT scopes_user_id_slug_key UNIQUE (user_id, slug);

UPDATE scopes 
  SET slug = name 
  WHERE is_system = true;

-- Add scope_id to todo_labels, update PK
ALTER TABLE todo_labels
  ADD COLUMN scope_id UUID REFERENCES scopes (id) ON DELETE CASCADE;

UPDATE todo_labels 
  SET scope_id = (SELECT id FROM scopes LIMIT 1);

ALTER TABLE todo_labels 
  DROP CONSTRAINT todo_labels_pkey;

ALTER TABLE todo_labels 
  ADD PRIMARY KEY (todo_id, label_id, scope_id);

ALTER TABLE todo_labels 
  ALTER COLUMN scope_id SET NOT NULL;

-- Add scope_id to TEMPLATES & create index
ALTER TABLE templates 
  ADD COLUMN scope_id UUID REFERENCES scopes(id),
  ADD COLUMN scope_type TEXT;

CREATE INDEX idx_templates_scope_id ON templates(scope_id);

UPDATE templates
  SET scope_type = item_type;

-- Add metadata to TEMPLATE_ITEMS
ALTER TABLE template_items
  ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE INDEX idx_scopes_deleted_at ON scopes(deleted_at);

UPDATE scopes
  SET position = subquery.row_number - 1
FROM (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) 
  FROM scopes
  WHERE is_system = true
) AS subquery
WHERE scopes.id = subquery.id;

COMMIT;
