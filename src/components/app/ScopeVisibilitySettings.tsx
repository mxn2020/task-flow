// components/app/ScopeVisibilitySettings.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as LucideIcons from "lucide-react";
import { useMenu } from '@/contexts/MenuContext';
import { SystemScopeType } from '@/types';
import { SYSTEM_SCOPES } from '@/types/icons';

interface ScopeVisibility {
  type: string;
  visible: boolean;
  position: number;
}

export default function ScopeVisibilitySettings() {
  const { data: session } = useSession();
  const [scopeSettings, setScopeSettings] = useState<ScopeVisibility[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { refreshMenu } = useMenu();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const loadScopeSettings = async () => {
      if (!session?.user?.id) return;

      // Get visibility settings from scopes table
      const { data: scopeData } = await supabase
        .from('scopes')
        .select('name, show_in_sidebar')
        .eq('is_system', true);

      // Get position settings from user_settings table
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('value')
        .eq('user_id', session.user.id)
        .eq('key', 'system_scope_positions')
        .single();

      if (scopeData) {
        const positions = settingsData?.value || {};
        const settings = SYSTEM_SCOPES.map((scope) => ({
          type: scope.type,
          visible: scopeData.find(s => s.name === scope.type)?.show_in_sidebar ?? true,
          position: positions[scope.type] ?? SYSTEM_SCOPES.findIndex(s => s.type === scope.type)
        }));
        setScopeSettings(settings.sort((a, b) => a.position - b.position));
      }
      setIsLoading(false);
    };

    loadScopeSettings();
  }, [session?.user?.id]);

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !session?.user?.id) return;
  
    try {
      const items = Array.from(scopeSettings);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
  
      const updatedItems = items.map((item, index) => ({
        ...item,
        position: index
      }));
  
      setScopeSettings(updatedItems);
  
      // Create positions object
      const positions = updatedItems.reduce((acc, item) => ({
        ...acc,
        [item.type]: item.position
      }), {});
  
      // Update user_settings using upsert with merge
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: session.user.id,
          key: 'system_scope_positions',
          value: positions
        }, { 
          onConflict: 'user_id,key',
          ignoreDuplicates: false
        });
  
      if (settingsError) throw settingsError;
  
      refreshMenu();
    } catch (error) {
      console.error('Error updating scope positions:', error);
    }
  };

  const handleToggleScope = async (scopeType: string) => {
    if (!session?.user?.id) return;

    try {
      const updatedSettings = scopeSettings.map(setting =>
        setting.type === scopeType
          ? { ...setting, visible: !setting.visible }
          : setting
      );

      setScopeSettings(updatedSettings);

      const { error } = await supabase
        .from('scopes')
        .update({ show_in_sidebar: !scopeSettings.find(s => s.type === scopeType)?.visible })
        .eq('name', scopeType)
        .eq('is_system', true);

      if (error) throw error;

      refreshMenu();
    } catch (error) {
      console.error('Error toggling scope visibility:', error);
    }
  };

  if (isLoading) {
    return null;
  }

  // Show all scopes in settings, but limit to 5 visible items at a time
  const displayScopes = scopeSettings;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sidebar Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose which items appear in your sidebar and arrange them in your preferred order.
            {isMobile && ' Up to 5 enabled items will be shown in mobile navigation.'}
          </p>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="scopes">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={cn(
                    "space-y-2",
                    isMobile && "max-h-80 overflow-y-auto pr-2"
                  )}
                >
                  {displayScopes.map((scope, index) => {
                    const scopeInfo = SYSTEM_SCOPES.find(s => s.type === scope.type)!;
                    const IconComponent = LucideIcons[scopeInfo.icon] as React.ComponentType<{ className?: string }>;

                    return (
                      <Draggable
                        key={scope.type}
                        draggableId={scope.type}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg",
                              snapshot.isDragging ? "bg-accent" : "hover:bg-accent/50"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5" />
                                <span className="font-medium">{scopeInfo.label}</span>
                              </div>
                            </div>
                            <Switch
                              checked={scope.visible}
                              onCheckedChange={() => handleToggleScope(scope.type)}
                            />
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </CardContent>
    </Card>
  );
}