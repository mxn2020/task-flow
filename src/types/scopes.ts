// types/scopes.ts
import { Scope, SystemScopeType } from './index';

// Utility type for creating scope-specific metadata
export type ScopeMetadata<T extends Record<string, { type: string; required?: boolean }> = Record<string, never>> = {
  fields: T;
  ui?: {
    hide_title?: boolean;
    content_as_title?: boolean;
    auto_title?: boolean;
  };
};

export type TodoScopeMetadata = ScopeMetadata<Record<string, never>>;

export interface BrainstormScopeMetadata extends ScopeMetadata {
  content: { type: 'text'; required: true };
}

export interface NoteScopeMetadata extends ScopeMetadata {
  content: { type: 'text'; required: true };
}

export type ChecklistScopeMetadata = ScopeMetadata<Record<string, never>>;

export interface MilestoneScopeMetadata extends ScopeMetadata {
  target_date: { type: 'date' };
  success_criteria: { type: 'text[]' };
  progress: { type: 'number' };
  impact: { type: 'text' };
}

export interface ResourceScopeMetadata extends ScopeMetadata {
  url: { type: 'text' };
  source: { type: 'text' };
  format: { type: 'select'; options: ['article', 'video', 'book', 'course'] };
  tags: { type: 'text[]' };
}

export interface TimeblockScopeMetadata extends ScopeMetadata {
  start_time: { type: 'timestamp' };
  end_time: { type: 'timestamp' };
  recurrence: { type: 'text' };
  energy_level: { type: 'number' };
}

export interface EventScopeMetadata extends ScopeMetadata {
  start: { type: 'timestamp' };
  end: { type: 'timestamp' };
  location: { type: 'text' };
  attendees: { type: 'text[]' };
  recurring: { type: 'boolean' };
}

export interface BookmarkScopeMetadata extends ScopeMetadata {
  url: { type: 'text' };
  favicon: { type: 'text' };
  description: { type: 'text' };
  tags: { type: 'text[]' };
  last_visited: { type: 'timestamp' };
}

export interface FlowScopeMetadata extends ScopeMetadata {
  dependencies: {
    type: 'array';
    items: {
      item_id: 'uuid';
      dependency_type: 'text';
      condition: 'jsonb';
    };
  };
  status: { type: 'select'; options: ['pending', 'ready', 'blocked', 'completed'] };
  completion_criteria: { type: 'text' };
  sub_dependencies: { type: 'jsonb' };
}

// Predefined system scope metadata types
export interface SystemScopeMetadata {
  todo: TodoScopeMetadata;
  brainstorm: BrainstormScopeMetadata;
  note: NoteScopeMetadata;
  checklist: ChecklistScopeMetadata;
  milestone: MilestoneScopeMetadata;
  resource: ResourceScopeMetadata;
  timeblock: TimeblockScopeMetadata;
  event: EventScopeMetadata;
  bookmark: BookmarkScopeMetadata;
  flow: FlowScopeMetadata;
}

// Type guard to check if a scope is a system scope
export function isSystemScope(scope: Scope): scope is Scope & { 
  name: SystemScopeType, 
  isSystem: true 
} {
  return scope.isSystem === true && [
    'todo', 'brainstorm', 'note', 'checklist', 
    'flow', 'milestone', 'resource', 
    'timeblock', 'event', 'bookmark'
  ].includes(scope.name);
}

// Helper to create a custom scope
export function createCustomScope(
  params: Omit<Scope, 'id' | 'isSystem' | 'createdAt' | 'slug'>
): Partial<Scope> {
  return {
    ...params,
    isSystem: false,
    slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  };
}

// Function to validate metadata against a scope's defined fields
export function validateScopeMetadata(
  scope: Scope, 
  metadata: Record<string, any>
): { valid: boolean; errors?: string[] } {
  const fields = scope.metadata?.fields || {};
  const errors: string[] = [];

  Object.entries(fields).forEach(([fieldName, fieldDef]) => {
    const value = metadata[fieldName];
    const isRequired = fieldDef.required;

    // Check for required fields
    if (isRequired && (value === undefined || value === null)) {
      errors.push(`Field '${fieldName}' is required`);
    }

    // Type checking (basic)
    if (value !== undefined) {
      switch (fieldDef.type) {
        case 'text':
          if (typeof value !== 'string') {
            errors.push(`Field '${fieldName}' must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field '${fieldName}' must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${fieldName}' must be a boolean`);
          }
          break;
        case 'array':
          if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
            errors.push(`Field '${fieldName}' must be an array of strings`);
          }
          break;
        case 'select':
          if (fieldDef.options && !fieldDef.options.includes(value)) {
            errors.push(`Field '${fieldName}' must be one of: ${fieldDef.options.join(', ')}`);
          }
          break;
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

