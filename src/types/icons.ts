import * as LucideIcons from "lucide-react";
import { SystemScopeType } from ".";

/**
 * IconName is a union of all the exported icon names from lucide-react,
 * ensuring type safety for your selected icon.
 */
export type IconName = keyof typeof LucideIcons;

export interface IconResponse {
  icons: IconName[];
  total: number;
  cache: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
}

export interface SystemScope {
  type: SystemScopeType;
  label: string;
  icon: IconName;
}

export const SYSTEM_SCOPES: SystemScope[] = [
  { type: 'todo', label: 'Todo', icon: 'CheckCircle' },
  { type: 'brainstorm', label: 'Brainstorm', icon: 'Lightbulb' },
  { type: 'note', label: 'Notes', icon: 'StickyNote' },
  { type: 'checklist', label: 'Checklists', icon: 'ListChecks' },
  { type: 'milestone', label: 'Milestones', icon: 'Target' },
  { type: 'resource', label: 'Resources', icon: 'BookOpen' },
  { type: 'timeblock', label: 'Timeblocks', icon: 'Clock' },
  { type: 'event', label: 'Events', icon: 'Calendar' },
  { type: 'bookmark', label: 'Bookmarks', icon: 'Bookmark' },
  { type: 'flow', label: 'Flows', icon: 'GitBranch' }
];