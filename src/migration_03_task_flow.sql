/*
  ---------------------------------------------------------
  1) MIGRATION: Initial schema setup
  ---------------------------------------------------------
*/

-- Enable UUID generation extension (if not already enabled).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2.1) GROUPS TABLE
--      This table helps to organize todos and notes into groups.
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure that each user can only have one group with the same name.
ALTER TABLE groups 
ADD CONSTRAINT unique_group_name_per_user 
UNIQUE (user_id, name);

-- 2.2) TYPES TABLE
--      User-defined "types" for categorizing items (e.g., "Personal", "Work", etc.)
CREATE TABLE IF NOT EXISTS types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- 2.3) CATEGORIES TABLE
--      Similar to types, but conceptually different, e.g., "Priority", "Routine".
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- 2.4) LABELS TABLE
--      Labels can be attached to items for custom tagging.
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- 2.5) TODOS TABLE
--      Main table for storing tasks, with optional references to parent tasks.
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES todos (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  type_id UUID REFERENCES types (id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories (id) ON DELETE SET NULL,
  color_display TEXT DEFAULT 'none',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2.6) TODO_LABELS TABLE (junction table)
--      Many-to-many relationship between todos and labels.
CREATE TABLE IF NOT EXISTS todo_labels (
  todo_id UUID REFERENCES todos (id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels (id) ON DELETE CASCADE,
  PRIMARY KEY (todo_id, label_id)
);

/*
  ---------------------------------------------------------
  3) FUNCTION: initialize_user_data()
     This function automatically inserts default Types, 
     Categories, and Labels whenever a new user is created.
  ---------------------------------------------------------
*/
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default types
  INSERT INTO types (user_id, name, color)
  VALUES 
    (NEW.user_id, 'Personal', '#3498db'),
    (NEW.user_id, 'Work', '#2ecc71'),
    (NEW.user_id, 'Study', '#e74c3c'),
    (NEW.user_id, 'Health', '#9b59b6'),
    (NEW.user_id, 'Finance', '#f1c40f');

  -- Insert default categories
  INSERT INTO categories (user_id, name, color)
  VALUES 
    (NEW.user_id, 'Priority', '#f39c12'),
    (NEW.user_id, 'Routine', '#1abc9c'),
    (NEW.user_id, 'Long-term', '#9b59b6'),
    (NEW.user_id, 'Short-term', '#34495e'),
    (NEW.user_id, 'Project', '#e67e22');

  -- Insert default labels
  INSERT INTO labels (user_id, name, color)
  VALUES 
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

/*
  ---------------------------------------------------------
  4) Add "soft delete" and "archive" columns to main tables
     so we can keep records without permanently deleting them.
  ---------------------------------------------------------
*/
ALTER TABLE todos 
  ADD COLUMN deleted_at TIMESTAMP,
  ADD COLUMN archived_at TIMESTAMP;

/*
  ---------------------------------------------------------
  5) CREATE INDEXES to improve performance on filtering
     by these new columns.
  ---------------------------------------------------------
*/
CREATE INDEX idx_todos_deleted_at ON todos(deleted_at);
CREATE INDEX idx_todos_archived_at ON todos(archived_at);

/*
  ---------------------------------------------------------
  6) CREATE VIEWS for active and archived items to simplify
     queries in the application layer.
  ---------------------------------------------------------
*/
CREATE VIEW active_todos AS
SELECT * FROM todos
WHERE deleted_at IS NULL AND archived_at IS NULL;

CREATE VIEW archived_todos AS
SELECT * FROM todos
WHERE deleted_at IS NULL AND archived_at IS NOT NULL;

/*
  ---------------------------------------------------------
  7) CREATE FUNCTIONS for "soft delete," "archive," and 
     "unarchive" actions for todos and brainstorms.
  ---------------------------------------------------------
*/
-- Soft delete a todo
CREATE OR REPLACE FUNCTION soft_delete_todo(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE todos
    SET deleted_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Archive a todo
CREATE OR REPLACE FUNCTION archive_todo(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE todos
    SET archived_at = NOW()
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Unarchive a todo
CREATE OR REPLACE FUNCTION unarchive_todo(item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE todos
    SET archived_at = NULL
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;


/*
  ---------------------------------------------------------
  8) TEMPLATES TABLE 
     and TEMPLATE_ITEMS TABLE 
     (used for creating reusable templates for todos, brainstorms, etc.).
  ---------------------------------------------------------
*/
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    name TEXT NOT NULL,                  -- (will be renamed later to 'title')
    item_type TEXT NOT NULL CHECK (item_type IN ('todo', 'brainstorm')), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS template_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES templates (id) ON DELETE CASCADE,
    parent_id UUID REFERENCES template_items (id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sort_order INT DEFAULT 0
);

/*
  ---------------------------------------------------------
  9) EXTEND TODOS TABLE with new features:
     - metadata (JSONB)
     - priority / tracking / progress columns
     - relationships
     - visibility
     - favorite flag
  ---------------------------------------------------------
*/
ALTER TABLE todos
  ADD COLUMN metadata JSONB DEFAULT '{}';

ALTER TABLE todos 
  ADD COLUMN priority_level INTEGER CHECK (priority_level BETWEEN 1 AND 5),
  ADD COLUMN is_urgent BOOLEAN DEFAULT false,
  ADD COLUMN importance_score INTEGER,
  ADD COLUMN started_at TIMESTAMP,
  ADD COLUMN paused_at TIMESTAMP,
  ADD COLUMN total_time_spent INTERVAL,
  ADD COLUMN estimated_duration INTERVAL;

ALTER TABLE todos 
  ADD COLUMN progress_percentage INTEGER CHECK (progress_percentage BETWEEN 0 AND 100),
  ADD COLUMN status TEXT CHECK (status IN ('not_started', 'in_progress', 'blocked', 'review', 'done')) DEFAULT 'not_started',
  ADD COLUMN blocked_reason TEXT,
  ADD COLUMN checklist_items JSONB DEFAULT '[]';

ALTER TABLE todos 
  ADD COLUMN dependent_on UUID[],
  ADD COLUMN blocked_by UUID[],
  ADD COLUMN related_to UUID[],
  ADD COLUMN notes TEXT,
  ADD COLUMN attachments JSONB DEFAULT '[]',
  ADD COLUMN tags TEXT[],
  ADD COLUMN custom_fields JSONB DEFAULT '{}',
  ADD COLUMN repeat_pattern TEXT,
  ADD COLUMN location TEXT;

ALTER TABLE todos 
  ADD COLUMN is_private BOOLEAN DEFAULT false,
  ADD COLUMN shared_with UUID[],
  ADD COLUMN visibility_level TEXT CHECK (visibility_level IN ('private', 'shared', 'public')) DEFAULT 'private';

-- Create indexes for these new columns
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority_level);
CREATE INDEX idx_todos_progress ON todos(progress_percentage);
CREATE INDEX idx_todos_visibility ON todos(visibility_level);

-- Example JSONB GIN index (though it references metadata->'dependencies' in the comment,
-- not specifically created in the above schema, this is a sample structure).
CREATE INDEX idx_todos_dependencies ON todos USING GIN (metadata);

ALTER TABLE todos 
  ADD COLUMN is_favorite BOOLEAN DEFAULT false;

/*
  ---------------------------------------------------------
  10) SCOPES TABLE
      Scopes define different item "types" (like "todo", 
      "brainstorm", "note", etc.) with custom fields 
      and UI configurations stored in metadata.
  ---------------------------------------------------------
*/
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

-- Add scope_id to todos
ALTER TABLE todos 
  ADD COLUMN scope_id UUID REFERENCES scopes (id) ON DELETE SET NULL;

/*
  ---------------------------------------------------------
  11) INSERT SYSTEM SCOPES: Basic built-in scopes 
      for standard item types.
  ---------------------------------------------------------
*/
INSERT INTO scopes (name, metadata, is_system) VALUES
('todo',       '{"fields": {}}', true),
('brainstorm', '{"fields": {"content": {"type": "text", "required": true}}}', true),
-- Note: 'note' will reuse the 'title' as main content
('note',       '{"fields": {"content": {"type": "text", "required": true}}, "ui": {"title_as_content": true}}', true),
('checklist',  '{"fields": {}}', true),
('milestone',  '{"fields": {
   "target_date": {"type": "date"},
   "success_criteria": {"type": "text[]"},
   "progress": {"type": "number"},
   "impact": {"type": "text"}
}}', true),
('resource',   '{"fields": {
   "url": {"type": "text"},
   "source": {"type": "text"},
   "format": {"type": "select", "options": ["article", "video", "book", "course"]},
   "tags": {"type": "text[]"}
}}', true),
('timeblock',  '{"fields": {
   "start_time": {"type": "timestamp"},
   "end_time": {"type": "timestamp"},
   "recurrence": {"type": "text"},
   "energy_level": {"type": "number"}
}}', true),
('event',      '{"fields": {
   "start": {"type": "timestamp"},
   "end": {"type": "timestamp"},
   "location": {"type": "text"},
   "attendees": {"type": "text[]"},
   "recurring": {"type": "boolean"}
}}', true),
('bookmark',   '{"fields": {
   "url": {"type": "text"},
   "favicon": {"type": "text"},
   "description": {"type": "text"},
   "tags": {"type": "text[]"},
   "last_visited": {"type": "timestamp"}
}}', true);

-- Flow scope with more complex structure.
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

/*
  ---------------------------------------------------------
  12) Update system scopes with default icons
  ---------------------------------------------------------
*/
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

/*
  ---------------------------------------------------------
  13) TEMPLATE_ITEMS: add scope_id 
      to associate a template item with a scope.
  ---------------------------------------------------------
*/
ALTER TABLE template_items
  ADD COLUMN scope_id UUID REFERENCES scopes(id),
  ADD COLUMN priority_level INTEGER,
  ADD COLUMN status TEXT,
  ADD COLUMN checklist_items JSONB,
  ADD COLUMN custom_fields JSONB,
  ADD COLUMN estimated_duration INTERVAL;

/*
  ---------------------------------------------------------
  15) Add default_template_id to SCOPES 
      to reference an optional default template.
  ---------------------------------------------------------
*/
ALTER TABLE scopes
ADD COLUMN default_template_id UUID REFERENCES templates(id);

/*
  ---------------------------------------------------------
  16) Add a slug to SCOPES for friendlier unique URLs, 
      then enforce uniqueness by (user_id, slug).
  ---------------------------------------------------------
*/
ALTER TABLE scopes 
ADD COLUMN slug TEXT NOT NULL DEFAULT '';

-- Convert the name to a slug (lowercase, replace non-alphanumeric with '-')
UPDATE scopes 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));

-- Drop old unique constraint, then add new constraints
ALTER TABLE scopes
DROP CONSTRAINT IF EXISTS scopes_user_id_name_key,
ADD CONSTRAINT scopes_user_id_name_key UNIQUE (user_id, name),
ADD CONSTRAINT scopes_user_id_slug_key UNIQUE (user_id, slug);

/*
  ---------------------------------------------------------
  17) Update system scopes to have slugs identical to the name
  ---------------------------------------------------------
*/
UPDATE scopes 
SET slug = name 
WHERE is_system = true;

/*
  ---------------------------------------------------------
  18) Add "show_in_sidebar" column to scopes
      to allow user to toggle visibility in the UI sidebar.
  ---------------------------------------------------------
*/
ALTER TABLE scopes
ADD COLUMN show_in_sidebar BOOLEAN DEFAULT true;

/*
  ---------------------------------------------------------
  19) Update the JUNCTION TABLE: todo_labels 
      to add scope_id, then make it part of the primary key.
  ---------------------------------------------------------
*/
ALTER TABLE todo_labels 
ADD COLUMN scope_id UUID REFERENCES scopes (id) ON DELETE CASCADE;

-- Populate existing rows with a default scope (picks the first scope in the table).
UPDATE todo_labels 
SET scope_id = (SELECT id FROM scopes LIMIT 1);

-- Drop old primary key and recreate with scope_id as well.
ALTER TABLE todo_labels 
DROP CONSTRAINT todo_labels_pkey;

ALTER TABLE todo_labels 
ADD PRIMARY KEY (todo_id, label_id, scope_id);

-- Make scope_id required (NOT NULL).
ALTER TABLE todo_labels 
ALTER COLUMN scope_id SET NOT NULL;

/*
  ---------------------------------------------------------
  20) Add scope_id to TEMPLATES 
      and create an index for better performance.
  ---------------------------------------------------------
*/
ALTER TABLE templates 
ADD COLUMN scope_id UUID REFERENCES scopes(id);

CREATE INDEX idx_templates_scope_id ON templates(scope_id);

/*
  ---------------------------------------------------------
  21) Add a new "scope_type" while retaining old "item_type",
      then remove the old column, and rename name -> title.
  ---------------------------------------------------------
*/
ALTER TABLE templates 
ADD COLUMN scope_type TEXT;

UPDATE templates
SET scope_type = item_type;

ALTER TABLE templates 
DROP COLUMN item_type;

ALTER TABLE templates 
RENAME COLUMN name TO title;

/*
  ---------------------------------------------------------
  22) Add metadata field to template_items 
      for custom data storage.
  ---------------------------------------------------------
*/
ALTER TABLE template_items
ADD COLUMN metadata JSONB DEFAULT '{}';

/*
  ---------------------------------------------------------
  23) SOFT DELETE & ARCHIVE for scopes
  ---------------------------------------------------------
*/
ALTER TABLE scopes
ADD COLUMN deleted_at TIMESTAMP;

CREATE INDEX idx_scopes_deleted_at ON scopes(deleted_at);

ALTER TABLE scopes
ADD COLUMN archived_at TIMESTAMP;

/*
  ---------------------------------------------------------
  24) POSITIONING for scopes
      Allows user to define the order scopes appear in UI.
  ---------------------------------------------------------
*/
ALTER TABLE scopes
ADD COLUMN position INTEGER;

-- Update existing "system" scopes with a default position
UPDATE scopes
SET position = subquery.row_number - 1
FROM (
  SELECT 
    id, 
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) 
  FROM scopes
  WHERE is_system = true
) as subquery
WHERE scopes.id = subquery.id;

