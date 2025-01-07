// types for metadata
export type ItemType = {
    id: string;
    name: string;
    color: string;
    for_todos: boolean;
    for_brainstorm: boolean;
  };
  
  export type ItemCategory = {
    id: string;
    name: string;
    color: string;
    for_todos: boolean;
    for_brainstorm: boolean;
  };
  
  export type ItemLabel = {
    id: string;
    name: string;
    color: string;
    for_todos: boolean;
    for_brainstorm: boolean;
  };
  
  export type ColorDisplayType = 'none' | 'vertical' | 'background';
  
  // Utility function to get combined color
  export function getItemColor(item: {
    type_id?: string | null, 
    category_id?: string | null, 
    label_ids?: string[] | null, 
    type?: ItemType, 
    category?: ItemCategory, 
    labels?: ItemLabel[]
  }): string | undefined {
    // Prioritize type color, then category color, then first label color
    if (item.type && item.type.color) return item.type.color;
    if (item.category && item.category.color) return item.category.color;
    if (item.labels && item.labels.length > 0) return item.labels[0].color;
    return undefined;
  }


  