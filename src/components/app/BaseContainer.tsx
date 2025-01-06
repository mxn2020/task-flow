// components/app/BaseContainer.tsx

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Archive, ChevronsUpDown, Layout, LayoutGrid, ListChecks, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BaseItem, BaseProps, ViewOptions, FilterOptions, ItemOptions } from '@/types/ui';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/command';
import { Checkbox } from '../ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { SystemScopeType } from '@/types';

interface BaseContainerProps<T extends BaseItem> extends BaseProps<T> {
  title: string;
  scopeType: SystemScopeType | string;
  renderAddForm: () => React.ReactNode;
  renderItems: (items: T[]) => React.ReactNode;
  viewMode?: 'normal' | 'archived' | 'deleted';
  onViewModeChange?: (mode: 'normal' | 'archived' | 'deleted') => void;
}

export function BaseContainer<T extends BaseItem>({
  title,
  scopeType,
  items,
  groups,
  types,
  categories,
  labels,
  viewOptions,
  filterOptions,
  itemOptions,
  onViewOptionsChange,
  onFilterOptionsChange,
  onItemOptionsChange,
  renderAddForm,
  renderItems,
  viewMode = 'normal',
  onViewModeChange,
  ...props
}: BaseContainerProps<T>) {

  return (
    <div className="max-w-4xl mx-auto mt-0 md:mt-10">
      <div className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewOptionsChange({
                isAdvancedMode: !viewOptions.isAdvancedMode
              })}
              className="ml-2"
            >
              {viewOptions.isAdvancedMode ?
                <LayoutGrid size={20} className="text-primary" /> :
                <Layout size={20} />
              }
            </Button>
          </CardTitle>


          <div className="flex flex-col items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const modes: Array<'normal' | 'archived' | 'deleted'> = ['normal', 'archived', 'deleted'];
                const currentIndex = modes.indexOf(viewMode);
                const nextIndex = (currentIndex + 1) % modes.length;
                onViewModeChange?.(modes[nextIndex]);
              }}
              className="flex flex-col items-center h-auto min-h-[4rem] px-3"
            >
              {viewMode === 'normal' && (
                <>
                  <ListChecks size={20} />
                  <span className="text-xs text-green-600 font-medium mt-1">Active</span>
                </>
              )}
              {viewMode === 'archived' && (
                <>
                  <Archive size={20} />
                  <span className="text-xs text-purple-600 font-medium mt-1">Archived</span>
                </>
              )}
              {viewMode === 'deleted' && (
                <>
                  <Trash2 size={20} />
                  <span className="text-xs text-red-600 font-medium mt-1">Deleted</span>
                </>
              )}
            </Button>
          </div>

        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Bar */}
            <Input
              type="text"
              placeholder="Search..."
              value={filterOptions.searchQuery}
              onChange={(e) => onFilterOptionsChange({ searchQuery: e.target.value })}
              className="w-full"
            />

            {/* Add Form */}
            {renderAddForm()}

            {viewOptions.isAdvancedMode && (
              <>
                {/* Options Section */}
                <Card className="p-4">
                  <h3 className="font-medium mb-2"> New {scopeType.charAt(0).toUpperCase() + scopeType.slice(1)} Options</h3>
                  <div className="flex flex-wrap gap-4">
                    <Select
                      value={itemOptions.groupId || 'no_group'}
                      onValueChange={(value) => onItemOptionsChange({
                        groupId: value === 'no_group' ? null : value
                      })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_group">No Group</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={itemOptions.parentId || 'no_parent'}
                      onValueChange={(value) => onItemOptionsChange({
                        parentId: value === 'no_parent' ? null : value
                      })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Parent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_parent">No Parent</SelectItem>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {/* Truncate content if needed */}
                            {(item as any).title || (item as any).content || 'Unnamed Item'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* View Options Section */}
                <Card className="p-4">
                  <h3 className="font-medium mb-2">View Options</h3>
                  <div className="flex flex-wrap gap-4">
                    <Select
                      value={viewOptions.sortBy}
                      onValueChange={(value) => onViewOptionsChange({ sortBy: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created">Created Date</SelectItem>
                        <SelectItem value="title">Title/Content</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={viewOptions.colorDisplay}
                      onValueChange={(value: any) => onViewOptionsChange({
                        colorDisplay: value
                      })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Color Display" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Color</SelectItem>
                        <SelectItem value="vertical">Vertical Bar</SelectItem>
                        <SelectItem value="background">Background</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>

                {/* Filters Section */}
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Filters</h3>
                  <div className="flex flex-wrap gap-4">
                    <Select
                      value={filterOptions.selectedType || ''}
                      onValueChange={(value) => onFilterOptionsChange({
                        selectedType: value || null
                      })}
                    >
                      <SelectTrigger className="w-[180px] group relative">
                        <div className="truncate pr-6">
                          <SelectValue placeholder="Select Type" />
                        </div>
                        {filterOptions.selectedType && (
                          <X
                            size={16}
                            className="absolute right-8 hover:text-gray-500"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onFilterOptionsChange({
                                selectedType: null
                              });
                            }}
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_type">All Types</SelectItem>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filterOptions.selectedCategory || ''}
                      onValueChange={(value) => onFilterOptionsChange({
                        selectedCategory: value || null
                      })}
                    >

                      <SelectTrigger className="w-[180px] group relative">
                        <div className="truncate pr-6">
                          <SelectValue placeholder="Select Category" />
                        </div>
                        {filterOptions.selectedCategory && (
                          <X
                            size={16}
                            className="absolute right-8 hover:text-gray-500"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onFilterOptionsChange({
                                selectedCategory: null
                              });
                            }}
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_category">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>


                    <Select
                      value={filterOptions.selectedGroup || ''}
                      onValueChange={(value) => onFilterOptionsChange({
                        selectedGroup: value || null
                      })}
                    >

                      <SelectTrigger className="w-[180px] group relative">
                        <div className="truncate pr-6">
                          <SelectValue placeholder="Select Group" />
                        </div>
                        {filterOptions.selectedGroup && (
                          <X
                            size={16}
                            className="absolute right-8 hover:text-gray-500"
                            onPointerDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onFilterOptionsChange({
                                selectedGroup: null
                              });
                            }}
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_group">All Groups</SelectItem>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Popover>
                      <div className="relative w-[180px]">
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between group"
                          >
                            <div className="truncate">
                              {(filterOptions.selectedLabels || []).length > 0 && (
                                `Labels (${(filterOptions.selectedLabels || []).length})`
                              ) || 'Select Labels'}
                            </div>
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        {filterOptions.selectedLabels?.length > 0 && (
                          <X
                            size={16}
                            className="absolute right-8 top-1/2 transform -translate-y-1/2 hover:text-gray-500 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onFilterOptionsChange({
                                selectedLabels: []
                              });
                            }}
                            aria-label="Clear Labels Filter"
                          />
                        )}
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search labels..." />
                            <CommandEmpty>No labels found.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-40 overflow-y-auto">
                                {labels.map((label) => (
                                  <CommandItem
                                    key={label.id}
                                    onSelect={() => {
                                      const currentLabels = filterOptions.selectedLabels || [];
                                      const newLabels = currentLabels.includes(label.id)
                                        ? currentLabels.filter(id => id !== label.id)
                                        : [...currentLabels, label.id];
                                      onFilterOptionsChange({
                                        selectedLabels: newLabels
                                      });
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        checked={(filterOptions.selectedLabels || []).includes(label.id)}
                                      />
                                      {label.name}
                                    </div>
                                  </CommandItem>
                                ))}
                              </div>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </div>
                    </Popover>



                  </div>
                </Card>
              </>
            )}
          </div>
        </CardContent>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderItems(items)}
      </motion.div>
    </div>
  );
}