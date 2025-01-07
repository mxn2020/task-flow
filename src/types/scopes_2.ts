// types/scopes_2.ts
import { Todo } from './index';

export type BaseScopeFormItem = Omit<ScopeItem, 'id' | 'userId' | 'scopeId'>;

export interface TodoScope extends Omit<Todo, 'scope'> {
  metadata: Record<string, never>;
}

export interface BrainstormScope extends Omit<Todo, 'scope'> {
  metadata: {
    content: string;
  };
}

export interface NoteScope extends Omit<Todo, 'scope'> {
  metadata: {
    content: string;
  };
}

export interface ChecklistScope extends Omit<Todo, 'scope'> {
  metadata: {
    items: Array<{
      id: string;
      text: string;
      completed: boolean;
      completedAt?: string;
    }>;
  };
}

export interface Dependency {
  itemId: string;
  dependencyType: string;
  condition?: Record<string, any>;
}

export interface FlowScope extends Omit<Todo, 'scope'> {
  metadata: {
    dependencies: Array<{
      itemId: string;
      dependencyType: string;
      condition?: Record<string, any>;
    }>;
    flow_status: 'pending' | 'ready' | 'blocked' | 'completed';
    completionCriteria?: string;
    subDependencies?: Record<string, any>;
  };
}

export interface MilestoneScope extends Omit<Todo, 'scope'> {
  metadata: {
    targetDate?: string;
    successCriteria: string[];
    progress: number;
    impact?: string;
  };
}

export interface ResourceScope extends Omit<Todo, 'scope'> {
  metadata: {
    url?: string;
    source?: string;
    format: 'article' | 'video' | 'book' | 'course';
    resourceTags: string[];
  };
}

export interface TimeblockScope extends Omit<Todo, 'scope'> {
  metadata: {
    startTime: string;
    endTime: string;
    recurrence?: string;
    energyLevel?: number;
  };
}

export interface EventScope extends Omit<Todo, 'scope'> {
  metadata: {
    start: string;
    end: string;
    location?: string;
    attendees: string[];
    recurring: boolean;
  };
}

export interface BookmarkScope extends Omit<Todo, 'scope'> {
  metadata: {
    url: string;
    favicon?: string;
    description?: string;
    bookmarkTags: string[];
    lastVisited?: string;
  };
}

export type ScopeItem =
  | TodoScope
  | BrainstormScope
  | NoteScope
  | ChecklistScope
  | FlowScope
  | MilestoneScope
  | ResourceScope
  | TimeblockScope
  | EventScope
  | BookmarkScope;