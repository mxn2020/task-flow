// components/app/IconPicker.tsx

'use client';

import React, { useState, useCallback, useRef } from "react";
import * as LucideIcons from "lucide-react";
import { IconName } from "@/types/icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command-2";
import { ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface IconPickerProps {
  selectedIcon?: IconName;
  onIconSelect: (iconName: IconName) => void;
  className?: string;
  placeholder?: string;
  defaultView?: 'grid' | 'list';
  limit?: number;
  gridColumns?: number;
  gridRows?: number;
  showIconName?: boolean;
}

interface IconResponse {
  icons: IconName[];
  total: number;
  hasNextPage: boolean;
  nextPage: number | null;
  pageInfo: {
    current: number;
    size: number;
    total: number;
  };
}

export function IconPicker({
  selectedIcon,
  onIconSelect,
  className,
  placeholder = "Select an icon",
  defaultView = 'grid',
  limit = 20,
  gridColumns = 6,
  gridRows = 8,
  showIconName = false
}: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>(defaultView);
  const [searchValue, setSearchValue] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchIcons = async ({ pageParam = 0 }): Promise<IconResponse> => {
    const params = new URLSearchParams({
      search: searchValue,
      page: pageParam.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`/api/icons?${params}`);
    if (!response.ok) throw new Error('Failed to fetch icons');
    return response.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isError,
    error
  } = useInfiniteQuery({
    queryKey: ['icons', searchValue],
    queryFn: fetchIcons,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0
  });

  const lastIconRef = useCallback((node: HTMLDivElement) => {
    if (!node || !hasNextPage || isFetching) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });

    observer.current.observe(node);
  }, [hasNextPage, isFetching, fetchNextPage]);

  const allIcons = data?.pages.flatMap(page => page.icons) ?? [];

  const handleWheel = (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
  };

  const renderIcon = (iconName: IconName, index: number, isLastElement: boolean) => {
    const IconComponent = LucideIcons[iconName] as React.ComponentType<{ className?: string }>;
  
    if (view === 'grid') {
      return (
        <TooltipProvider key={`${iconName}-${index}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center w-full">
                <CommandItem
                  ref={isLastElement ? lastIconRef : null}
                  value={iconName}
                  onSelect={() => {
                    onIconSelect(iconName);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center justify-center h-full w-full"
                >
                  <IconComponent className="h-8 w-8" />
                </CommandItem>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{iconName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  
    return (
      <CommandItem
        ref={isLastElement ? lastIconRef : null}
        key={`${iconName}-${index}`}
        value={iconName}
        onSelect={() => {
          onIconSelect(iconName);
          setOpen(false);
        }}
        className="flex items-center gap-2 p-2"
      >
        <IconComponent className="h-6 w-6" />
        <span className="truncate">{iconName}</span>
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-[280px]", className)}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedIcon ? (
                <div className="flex items-center gap-2">
                  {React.createElement(LucideIcons[selectedIcon] as React.ComponentType<{ className?: string }>, { className: "h-4 w-4" })}
                  {showIconName && (
                    <span className="truncate">{selectedIcon}</span>
                  )}
                </div>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        {selectedIcon && (
          <X
            size={16}
            className="absolute right-10 top-1/2 transform -translate-y-1/2 hover:text-gray-500 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onIconSelect('' as IconName);
            }}
            aria-label="Clear Selected Icon"
          />
        )}

        <PopoverContent className={cn("p-0", view === 'grid' ? "w-[400px]" : "w-[280px]")} align="start">
          <Command className="overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b">
              <CommandInput
                placeholder="Search icons..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex-1"
              />
              <div className="flex gap-1 ml-2">
                <Button
                  variant={view === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('grid')}
                >
                  <LucideIcons.LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('list')}
                >
                  <LucideIcons.List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <CommandEmpty>No icons found.</CommandEmpty>

            <div
              className="max-h-[320px] overflow-y-auto"
              onWheel={handleWheel}
              style={{ touchAction: 'pan-y' }}
            >
              <CommandGroup>
                <div className="p-1">
                  {isFetching && allIcons.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                      Loading icons...
                    </div>
                  ) : isError ? (
                    <div className="py-6 text-center text-sm text-red-500">
                      {error instanceof Error ? error.message : 'Failed to load icons'}
                    </div>
                  ) : allIcons.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-500">
                      No icons found.
                    </div>
                  ) : (
                    <div className={cn(
                      view === 'grid' && 'grid gap-2',
                      view === 'grid' && (
                        gridColumns === 2 ? 'grid-cols-2' :
                          gridColumns === 4 ? 'grid-cols-4' :
                            gridColumns === 6 ? 'grid-cols-6' :
                              gridColumns === 8 ? 'grid-cols-8' :
                                gridColumns === 10 ? 'grid-cols-10' :
                                  gridColumns === 12 ? 'grid-cols-12' :
                                    'grid-cols-6'
                      ),
                      view === 'list' && 'flex flex-col gap-1'
                    )}>
                      {allIcons.map((iconName, index) => renderIcon(
                      iconName,
                      index,
                      index === allIcons.length - 1
                    ))}
                    </div>
                  )}
                  {isFetching && allIcons.length > 0 && (
                    <div className="py-2 text-center col-span-full">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  )}
                </div>
              </CommandGroup>
            </div>
          </Command>
        </PopoverContent>
      </div>
    </Popover>
  );
}

