import { SystemScopeType } from '@/types';
import { ScopeItem, Dependency } from '@/types/scopes_2';

type BaseScopeFormItem = Omit<ScopeItem, 'id' | 'userId' | 'scopeId'>;

interface BaseProps {
  itemOptions: {
    parentId: string | null;
  };
  onItemOptionsChange: (options: { parentId: string | null }) => void;
}

type CreateItemFn = (item: BaseScopeFormItem) => Promise<void>;

interface RenderAddFormProps {
  title: string;
  selectedColor: string;
  scopeType: SystemScopeType | string;
  baseProps: BaseProps;
  setTitle: (title: string) => void;
  setSelectedColor: (color: string) => void;
  createItem: CreateItemFn;
}

export const renderAddForm = ({
  title,
  selectedColor,
  scopeType,
  baseProps,
  setTitle,
  setSelectedColor,
  createItem
}: RenderAddFormProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const baseItem = {
      id: crypto.randomUUID(),
      title: title.trim(),
      colorDisplay: selectedColor,
      parentId: baseProps.itemOptions.parentId,
      status: 'not_started' as const,
      isUrgent: false,
      isFavorite: false,
      isPrivate: false,
      visibilityLevel: 'private' as const,
      checklistItems: [],
      attachments: [],
      tags: [],
      customFields: {},
      createdAt: new Date().toISOString()
    };

    let newItem: BaseScopeFormItem;
    switch (scopeType) {
      case 'todo':
        newItem = {
          ...baseItem,
          metadata: {}
        };
        break;
      case 'brainstorm':
      case 'note':
        newItem = {
          ...baseItem,
          metadata: {
            content: '-'
          }
        };
        break;
      case 'checklist':
        newItem = {
          ...baseItem,
          metadata: {
            items: []
          }
        };
        break;
      case 'flow':
        newItem = {
          ...baseItem,
          metadata: {
            dependencies: [] as Dependency[],
            flow_status: 'pending' as const,
            completionCriteria: '',
            subDependencies: {}
          }
        };
        break;
      case 'milestone':
        newItem = {
          ...baseItem,
          metadata: {
            successCriteria: [],
            progress: 0
          }
        };
        break;
      case 'resource':
        newItem = {
          ...baseItem,
          metadata: {
            format: 'article' as const,
            resourceTags: []
          }
        };
        break;
      case 'timeblock':
        newItem = {
          ...baseItem,
          metadata: {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString()
          }
        };
        break;
      case 'event':
        newItem = {
          ...baseItem,
          metadata: {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
            attendees: [],
            recurring: false
          }
        };
        break;
      case 'bookmark':
        newItem = {
          ...baseItem,
          metadata: {
            url: '',
            bookmarkTags: [],
            lastVisited: new Date().toISOString()
          }
        };
        break;
      default:
        newItem = {
          ...baseItem,
          metadata: {}
        };
    }

    await createItem(newItem);

    setTitle('');
    setSelectedColor('');
    baseProps.onItemOptionsChange({ parentId: null });
  };

  return { handleSubmit };
};

export default renderAddForm;