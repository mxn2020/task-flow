// types/base.ts
import { Category, Group, Label, TemplateItem, Todo, TodoStatus, TodoVisibilityLevel, Type } from ".";

export interface BaseTemplateItem {
  id: string;
  userId: string;
  title: string;
  scopeId?: string;
  scopeType?: string;
  items?: TemplateItem[];
  parentId?: string | null;
  groupId?: string | null;
  typeId?: string | null;
  categoryId?: string | null;
  type?: Type;
  category?: Category;
  labels?: Label[];
  colorDisplay?: string;
  notes?: string;
  deadline?: string;
  completedAt?: string | null;
  createdAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
}

export interface BaseItem {
  id: string;
  userId: string;
  title: string;
  scopeId: string;
  isFavorite: boolean;
  isUrgent: boolean;
  isPrivate: boolean;
  visibilityLevel: TodoVisibilityLevel;
  status: TodoStatus;
  parentId?: string | null;
  groupId?: string | null;
  typeId?: string | null;
  categoryId?: string | null;
  type?: Type;
  category?: Category;
  labels?: Label[];
  colorDisplay?: string;
  checklistItems: any[];
  attachments: any[];
  tags: string[];
  notes?: string;
  deadline?: string;
  customFields: Record<string, any>;
  completedAt?: string | null;
  createdAt: string;
  archivedAt?: string | null;
  deletedAt?: string | null;
}

export interface ViewOptions {
  colorDisplay: 'none' | 'vertical' | 'background';
  sortBy: string;
  isAdvancedMode: boolean;
}

export interface FilterOptions {
  selectedGroup: string | null;
  selectedType: string | null;
  selectedCategory: string | null;
  selectedLabels: string[];
  labelSearchQuery: string;
  searchQuery: string;
}

export interface ItemOptions {
  parentId: string | null;
  groupId: string | null;
}

export interface BaseProps<T extends BaseItem> {
  items: T[];
  groups: Group[];
  types: Type[];
  categories: Category[];
  labels: Label[];
  viewOptions: ViewOptions;
  filterOptions: FilterOptions;
  itemOptions: ItemOptions;
  onViewOptionsChange: (options: Partial<ViewOptions>) => void;
  onFilterOptionsChange: (options: Partial<FilterOptions>) => void;
  onItemOptionsChange: (options: Partial<ItemOptions>) => void;
  onItemCreate: (data: Partial<T>) => Promise<T>;
  onItemUpdate: (id: string, data: Partial<T>) => Promise<T>;
  onItemArchive: (id: string) => Promise<void>;
  onItemDelete: (id: string) => Promise<void>;
}