// components/app/organization/MobileOrganizationPage.tsx

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger }
  from '@/components/ui/dropdown-menu';
import { ScopeDialog } from '@/components/task/ScopeDialog';
import { ItemDialog } from '@/components/task/ItemDialog';
import { Group, Type, Category, Label, Scope } from '@/types';
import {
  ChevronLeft, MoreVertical, Archive, ArchiveRestore, Pen, Trash2, Plus, ChevronRight,
  FolderKanban, Tag, Bookmark, GitBranch, Target, Home
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { toCamelCase, toSnakeCase } from '@/lib/utils';
import { useMenu } from '@/contexts/MenuContext';

type Item = Group | Type | Category | Label | Scope;
type ItemType = 'group' | 'type' | 'category' | 'label' | 'scope';
type View = 'main' | 'list' | 'detail';

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  type: ItemType;
}

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
}

const sections: Section[] = [
  { id: 'groups', title: 'Groups', icon: FolderKanban, type: 'group' },
  { id: 'types', title: 'Types', icon: Tag, type: 'type' },
  { id: 'categories', title: 'Categories', icon: Bookmark, type: 'category' },
  { id: 'labels', title: 'Labels', icon: GitBranch, type: 'label' },
  { id: 'scopes', title: 'Scopes', icon: Target, type: 'scope' }
];

const sliderVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0
  })
};

const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon {...props} /> : null;
};

export default function MobileOrganizationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [view, setView] = useState<View>('main');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [items, setItems] = useState<Record<ItemType, Item[]>>({
    group: [],
    type: [],
    category: [],
    label: [],
    scope: []
  });
  const [systemScopes, setSystemScopes] = useState<Scope[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);
  const { refreshMenu } = useMenu();

  // Touch handling with improved edge detection
  const [touchStart, setTouchStart] = useState({ x: 0, startX: 0 });
  const minSwipeDistance = 50;
  const edgeThreshold = 50;

  const currentItems = activeSection ? items[activeSection.type] : [];

  interface UserSettings {
    value: Record<string, number>;
  }

  const fetchItems = useCallback(async () => {
    if (!userId) return;
  
    const promises = [
      ...sections.slice(0, -1).map(section =>
        supabase.from(section.id).select('*').eq('user_id', userId)
      ),
      supabase.from('scopes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_system', false)
        .is('deleted_at', null),
      supabase.from('scopes')
        .select('*')
        .eq('is_system', true),
      supabase.from('user_settings')
        .select('value')
        .eq('user_id', userId)
        .eq('key', 'system_scope_positions')
        .single()
    ];
  
    const results = await Promise.all(promises);
  
    const positions = (results[6].data as UserSettings)?.value || {};
    const systemScopeData = toCamelCase(results[5].data) || [];
    
    const sortedSystemScopes = [...systemScopeData].sort((a, b) => {
      const posA = positions[a.name] ?? Object.keys(positions).length;
      const posB = positions[b.name] ?? Object.keys(positions).length;
      return posA - posB;
    });
  
    setItems({
      group: toCamelCase(results[0].data) || [],
      type: toCamelCase(results[1].data) || [],
      category: toCamelCase(results[2].data) || [],
      label: toCamelCase(results[3].data) || [],
      scope: toCamelCase(results[4].data) || []
    });
    setSystemScopes(sortedSystemScopes);
}, [userId]);


  useEffect(() => {
    if (userId) fetchItems();
  }, [userId, fetchItems]);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({
      x: touch.clientX,
      startX: touch.clientX
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.x) return;

    const currentX = e.touches[0].clientX;
    const diff = touchStart.x - currentX;

    if (touchStart.startX < edgeThreshold || touchStart.startX > window.innerWidth - edgeThreshold) {
      e.preventDefault();
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.x) return;

    const currentX = e.changedTouches[0].clientX;
    const diff = touchStart.x - currentX;
    const isFromLeftEdge = touchStart.startX < edgeThreshold;
    const isFromRightEdge = touchStart.startX > window.innerWidth - edgeThreshold;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        // Swipe left - forward navigation if needed
      } else {
        if (isFromLeftEdge && view !== 'main') {
          router.back();
        } else if (!isFromLeftEdge && view !== 'main') {
          handleBack();
        }
      }
    }

    setTouchStart({ x: 0, startX: 0 });
  };

  const navigateTo = (newView: View, direction: number) => {
    setSlideDirection(direction);
    setView(newView);
  };

  const handleSectionSelect = (section: Section) => {
    setActiveSection(section);
    navigateTo('list', 1);
  };

  const handleItemSelect = (item: Item) => {
    setSelectedItem(item);
    navigateTo('detail', 1);
  };

  const handleBack = () => {
    if (view === 'detail') {
      navigateTo('list', -1);
      setSelectedItem(undefined);
    } else if (view === 'list') {
      navigateTo('main', -1);
      setActiveSection(null);
    }
  };

  const handleDelete = async (item: Item) => {
    const table = activeSection?.id;
    if (!table) return;

    if (table === 'scopes') {
      await supabase
        .from(table)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.id);
    } else {
      await supabase.from(table).delete().eq('id', item.id);
    }

    setDeleteDialogOpen(false);
    handleBack();
    fetchItems();
    refreshMenu();
  };

  const handleSave = async (itemData: Partial<Item>) => {
    if (!activeSection) return;

    const data = toSnakeCase(itemData);
    const table = activeSection.id;

    try {
      if (selectedItem) {
        await supabase.from(table)
          .update(data)
          .eq('id', selectedItem.id);
      } else {
        await supabase.from(table)
          .insert([{ ...data, user_id: userId }]);
      }

      setItemDialogOpen(false);
      fetchItems();
      refreshMenu();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleArchiveToggle = async (scope: Scope) => {
    const newArchivedAt = scope.archivedAt ? null : new Date().toISOString();
    await supabase
      .from('scopes')
      .update({ archived_at: newArchivedAt })
      .eq('id', scope.id);
    fetchItems();
    refreshMenu();
  };

  const renderHeader = () => (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="flex items-center justify-between p-4">
        {view !== 'main' ? (
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-6 w-6" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
            <Home className="h-6 w-6" />
          </Button>
        )}

        <h1 className="font-semibold text-lg">
          {view === 'main' && 'Organization'}
          {view === 'list' && activeSection?.title}
          {view === 'detail' && selectedItem?.name}
        </h1>

        <div className="w-10">
          {view === 'list' ? (
            <Button variant="ghost" size="icon" onClick={() => setItemDialogOpen(true)}>
              <Plus className="h-6 w-6" />
            </Button>
          ) : view === 'detail' && selectedItem && !('isSystem' in selectedItem && selectedItem.isSystem) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setItemDialogOpen(true)}>
                  <Pen className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                {activeSection?.type === 'scope' && (
                  <DropdownMenuItem onClick={() => handleArchiveToggle(selectedItem as Scope)}>
                    {(selectedItem as Scope).archivedAt ? (
                      <><ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive</>
                    ) : (
                      <><Archive className="mr-2 h-4 w-4" /> Archive</>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="text-red-500"
                  onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );

  const renderMainView = () => (
    <div className="p-4 space-y-2">
      {sections.map((section) => (
        <Card key={section.id} className="w-full" onClick={() => handleSectionSelect(section)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <section.icon size={24} />
                <span className="font-medium">{section.title}</span>
              </div>
              <ChevronRight size={20} className="text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderListView = () => {
    if (!activeSection) return null;
    const showScopes = activeSection.type === 'scope';
  
    return (
      <div className="space-y-4 p-4">
        {showScopes ? (
          <>
            <h2 className="font-semibold mt-6">User Scopes</h2>
            <div className="space-y-2">
              {currentItems.map((item) => (
                <Card key={item.id} className="w-full" onClick={() => handleItemSelect(item)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                    {'icon' in item && item.icon && (
                        <DynamicIcon name={item.icon} size={24} />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {'archivedAt' in item && (
                          <p className="text-sm text-muted-foreground">
                            {item.archivedAt ? 'Archived' : 'Active'}
                          </p>
                        )}
                      </div>
                      <ChevronRight size={20} className="text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
  
            <h2 className="font-semibold mt-6">System Scopes</h2>
            <div className="space-y-2">
              {systemScopes.map((item) => (
                <Card key={item.id} className="w-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {item.icon && <DynamicIcon name={item.icon} size={24} />}
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">System</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {currentItems.map((item) => (
              <Card key={item.id} className="w-full" onClick={() => handleItemSelect(item)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {'icon' in item && item.icon && (
                        <DynamicIcon name={item.icon} size={24} />
                      )}
                      {'color' in item && (
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created: {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDetailView = () => {
    if (!selectedItem || !activeSection) return null;

    return (
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-3 mb-4">
            {'icon' in selectedItem && selectedItem.icon && (
              <DynamicIcon name={selectedItem.icon} size={32} />
            )}
            <h2 className="text-xl font-semibold">{selectedItem.name}</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Details</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Created</dt>
                  <dd>{new Date(selectedItem.createdAt).toLocaleDateString()}</dd>
                </div>
                {'archivedAt' in selectedItem && selectedItem.archivedAt && (
                  <div>
                    <dt className="text-sm text-muted-foreground">Archived</dt>
                    <dd>{new Date(selectedItem.archivedAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {renderHeader()}

      <main className="pt-16 pb-16">
        <AnimatePresence initial={false} custom={slideDirection} mode="wait">
          <motion.div
            key={view}
            custom={slideDirection}
            variants={sliderVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.2,
              ease: "easeInOut"
            }}
            className="min-h-[calc(100vh-8rem)] overflow-x-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {view === 'main' && renderMainView()}
            {view === 'list' && renderListView()}
            {view === 'detail' && renderDetailView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {activeSection?.title.slice(0, -1)}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => selectedItem && handleDelete(selectedItem)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {activeSection?.type === 'scope' ? (
        <ScopeDialog
          scope={selectedItem as Scope}
          isOpen={itemDialogOpen}
          onClose={() => setItemDialogOpen(false)}
          onSave={handleSave}
        />
      ) : (
        <ItemDialog
          item={selectedItem}
          type={activeSection?.type || 'group'}
          isOpen={itemDialogOpen}
          onClose={() => setItemDialogOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}