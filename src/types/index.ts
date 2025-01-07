// types/index.ts

import { FieldConfig } from "@/utils/validation";

export type TodoStatus = 'not_started' | 'in_progress' | 'blocked' | 'review' | 'done';
export type TodoVisibilityLevel = 'private' | 'shared' | 'public';

export type Group = {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
 };
 
 export type Type = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
 };
 
 export type Category = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
 };
 
 export type Label = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
 };
 
 export type Scope = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  color?: string;
  icon?: string;
  showInSidebar: boolean;
  metadata: {
    fields: Record<string, FieldConfig>;
    ui?: {
      hideTitle?: boolean;
      contentAsTitle?: boolean;
      autoTitle?: boolean;
    };
  };
  isSystem: boolean;
  defaultTemplateId?: string;
  createdAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
};
 
 export type TodoLabel = {
  todoId: string;
  labelId: string;
 };
 
 export type Todo = {
  id: string;
  userId: string;
  title: string;
  parentId?: string | null;
  groupId?: string | null;
  scopeId: string;
  scope?: Scope;
  typeId?: string | null;
  categoryId?: string | null;
  type?: Type;
  category?: Category;
  labels?: Label[];
  colorDisplay?: string;
  
  // New fields
  completedAt?: string | null;
  deadline?: string;
  isFavorite: boolean;
  
  priorityLevel?: number;
  isUrgent: boolean;
  importanceScore?: number;
  
  startedAt?: string;
  pausedAt?: string;
  totalTimeSpent?: string;
  estimatedDuration?: string;
  
  progressPercentage?: number;
  status: TodoStatus;
  blockedReason?: string;
  checklistItems: any[];
  
  dependentOn?: string[];
  blockedBy?: string[];
  relatedTo?: string[];
  
  notes?: string;
  attachments: any[];
  tags: string[];
  customFields: Record<string, any>;
  repeatPattern?: string;
  location?: string;
  
  isPrivate: boolean;
  sharedWith?: string[];
  visibilityLevel: TodoVisibilityLevel;
  
  createdAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
 };
 
 export type Template = {
  id: string;
  userId: string;
  title: string;
  scopeId?: string;
  scopeType: SystemScopeType | string;
  items: TemplateItem[];
  createdAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
 };
 
 export type TemplateItem = {
  id: string;
  templateId?: string;
  parentId?: string | null;
  title: string;
  sortOrder?: number;
  scopeId?: string;
  priorityLevel?: number;
  status?: string;
  checklistItems?: any[];
  customFields?: Record<string, any>;
  estimatedDuration?: string;
  children: TemplateItem[];
 };
 
 export type ObjectType = 
 | 'scope' 
 | 'template'
 | 'tree';
 
 export type SystemScopeType =
  | 'todo'
  | 'brainstorm'
  | 'note'
  | 'checklist'
  | 'flow'
  | 'milestone'
  | 'resource'
  | 'timeblock'
  | 'event'
  | 'bookmark';