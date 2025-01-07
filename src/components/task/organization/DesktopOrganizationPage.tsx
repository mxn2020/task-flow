// app/organization/page.tsx

'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ScopeDialog } from '@/components/app/ScopeDialog';
import { ItemDialog } from '@/components/app/ItemDialog';
import { Group, Type, Category, Label, Scope } from '@/types';
import { Plus, Trash2, Lock, CheckCircle, Lightbulb, StickyNote, ListChecks, Target, Book, Calendar, CalendarDays, Bookmark, GitBranch } from 'lucide-react';

import * as LucideIcons from 'lucide-react';
import { toCamelCase, toSnakeCase } from '@/lib/utils';
import { useMenu } from '@/contexts/MenuContext';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}

const DynamicIcon = ({ name, ...props }: IconProps & { name: string }) => {
  const Icon = (LucideIcons as any)[name];
  return Icon ? <Icon {...props} /> : null;
};



type Item = Group | Type | Category | Label | Scope;
type TabType = 'groups' | 'types' | 'categories' | 'labels' | 'scopes';



export default function DesktopOrganizationPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [items, setItems] = useState<Record<TabType, Item[]>>({
    groups: [],
    types: [],
    categories: [],
    labels: [],
    scopes: []
  });
  const [systemScopes, setSystemScopes] = useState<Scope[]>([]);

  const [icon, setIcon] = useState('');
  const [error, setError] = useState('');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('groups');

  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [selectedScope, setSelectedScope] = useState<Scope | undefined>();

  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | undefined>();

  const { refreshMenu } = useMenu();

  const fetchAllData = useCallback(async () => {
    if (!userId) return;
  
    const promises = [
      supabase.from('groups').select('*').eq('user_id', userId),
      supabase.from('types').select('*').eq('user_id', userId),
      supabase.from('categories').select('*').eq('user_id', userId),
      supabase.from('labels').select('*').eq('user_id', userId),
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
  
    const positions = (results[6].data as { value: Record<string, number> })?.value || {};
    const systemScopeData = toCamelCase(results[5].data) || [];
    
    const sortedSystemScopes = [...systemScopeData].sort((a, b) => {
      const posA = positions[a.name] ?? Object.keys(positions).length;
      const posB = positions[b.name] ?? Object.keys(positions).length;
      return posA - posB;
    });
  
    setItems({
      groups: toCamelCase(results[0].data) || [],
      types: toCamelCase(results[1].data) || [],
      categories: toCamelCase(results[2].data) || [],
      labels: toCamelCase(results[3].data) || [],
      scopes: toCamelCase(results[4].data) || []
    });
    setSystemScopes(sortedSystemScopes);
}, [userId]);

  useEffect(() => {
    if (userId) fetchAllData();
  }, [userId, fetchAllData]);

  async function handleItemSave(itemData: Partial<Item>) {

    const data = toSnakeCase(itemData);

    try {
      const { error: err } = await supabase
        .from(activeTab)
        .insert([{ ...data, user_id: userId }]);

      if (err?.code === '23505') {
        setError(`A ${activeTab.slice(0, -1)} with this name already exists`);
        return;
      }

      setError('');
      fetchAllData();
    } catch (e) {
      setError('Error saving item');
    }
  }

  async function handleScopeUpdate(scopeData: Partial<Scope>) {

    const data = toSnakeCase(scopeData);

    const operation = selectedScope
      ? supabase.from('scopes').update(data).eq('id', selectedScope.id)
      : supabase.from('scopes').insert([{ ...data, user_id: userId, is_system: false }]);

    await operation;
    fetchAllData();
    refreshMenu();
  }

  async function handleSoftDelete(item: Item) {
    if (activeTab === 'scopes') {
      await supabase
        .from('scopes')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.id);
    } else {
      await supabase.from(activeTab).delete().eq('id', item.id);
    }
    setItemToDelete(null);
    setDeleteDialogOpen(false);
    fetchAllData();
  }

  async function handleArchiveToggle(scope: Scope) {
    const newArchivedAt = scope.archivedAt ? null : new Date().toISOString();
    await supabase
      .from('scopes')
      .update({ archived_at: newArchivedAt })
      .eq('id', scope.id);
    fetchAllData();
    refreshMenu();
  }

  async function confirmDelete() {
    if (itemToDelete) {
      await supabase.from(activeTab).delete().eq('id', itemToDelete.id);
      setItemToDelete(null);
      setDeleteDialogOpen(false);
      fetchAllData();
    }
  }

  const handleDeleteClick = (item: Item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const renderItemSection = (items: Item[]) => (
    <div className="space-y-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-4">
                      {'icon' in item && item.icon && (
                        <div className="text-muted-foreground">
                          <DynamicIcon name={item.icon} size={30} />
                        </div>
                      )}
                      {'color' in item && (
                        <div
                          className="w-4 h-4 rounded-full gap-4"
                          style={{ backgroundColor: item.color }}
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        {'isSystem' in item && item.isSystem && (
                          <Lock size={14} className="text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {!('isSystem' in item && item.isSystem) && (
                    <div className="flex gap-2">
                      {activeTab === 'scopes' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedScope(item as Scope);
                            setScopeDialogOpen(true);
                          }}
                        >
                          <LucideIcons.Pen size={16} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setItemDialogOpen(true);
                          }}
                        >
                          <LucideIcons.Pen size={16} />
                        </Button>
                      )}
                      {activeTab === 'scopes' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveToggle(item as Scope)}
                        >
                          {(item as Scope).archivedAt ? (
                            <LucideIcons.ArchiveRestore size={16} className="text-orange-500" />
                          ) : (
                            <LucideIcons.Archive size={16} />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto mt-0 md:mt-14">
      <div className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Organization
            <div className="h-9 ml-2" />
          </CardTitle>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as TabType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="labels">Labels</TabsTrigger>
            <TabsTrigger value="scopes">Scopes</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {['groups', 'types', 'categories', 'labels', 'scopes'].map((tab) => (
              activeTab === tab && (
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TabsContent value={tab} forceMount>
                    {tab === 'scopes' ? (
                      <>
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>User Scopes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Button onClick={() => setScopeDialogOpen(true)}>
                              <Plus className="mr-2" /> Add Scope
                            </Button>
                          </CardContent>
                        </Card>

                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>User Scopes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {renderItemSection(items.scopes)}
                          </CardContent>
                        </Card>

                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>System Scopes</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {renderItemSection(systemScopes)}
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <>
                        <Card className="mb-6">
                          <CardHeader>
                            <CardTitle>{tab.charAt(0).toUpperCase() + tab.slice(1)}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Button onClick={() => setItemDialogOpen(true)}>
                              <Plus className="mr-2" /> Add {tab.slice(0, -1)}
                            </Button>
                          </CardContent>
                        </Card>
                        <div className="space-y-2">
                          {renderItemSection(items[tab as TabType])}
                        </div>
                      </>
                    )}
                  </TabsContent>
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </Tabs>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activeTab === 'scopes' ? 'Delete Scope' : `Delete ${activeTab.slice(0, -1)}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeTab === 'scopes' 
                ? 'Are you sure you want to delete this scope? It will be soft deleted and can be restored later.'
                : `Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => handleSoftDelete(itemToDelete!)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <ScopeDialog
          scope={selectedScope}
          isOpen={scopeDialogOpen}
          onClose={() => {
            setScopeDialogOpen(false);
            setSelectedScope(undefined);
          }}
          onSave={handleScopeUpdate}
        />

        <ItemDialog
          item={selectedItem}
          type={activeTab.slice(0, -1) as 'group' | 'type' | 'category' | 'label'}
          isOpen={itemDialogOpen}
          onClose={() => {
            setItemDialogOpen(false);
            setSelectedItem(undefined);
          }}
          onSave={handleItemSave}
        />
      </div>
    </div>
  );
}