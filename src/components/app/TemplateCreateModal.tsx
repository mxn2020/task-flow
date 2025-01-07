// components/app/TemplateCreateModal.tsx
'use client';

import React, { useState } from 'react';
import { SystemScopeType, Template } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScopes } from '@/contexts/ScopesContext';

interface TemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (template: Partial<Template>) => Promise<Template>;
}

export function TemplateCreateModal({
  isOpen,
  onClose,
  onCreate
}: TemplateCreateModalProps) {
  const [title, setTitle] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('');
  const { systemScopes, userScopes } = useScopes();

  const handleCreate = async () => {
    if (!title.trim() || !selectedScope) return;

    const scope = [...systemScopes, ...userScopes].find(s => s.id === selectedScope);
    if (!scope) return;

    await onCreate({
      title: title.trim(),
      scopeId: scope.id,
      scopeType: scope.isSystem ? (scope.name as SystemScopeType) : 'custom',
      items: []
    });

    setTitle('');
    setSelectedScope('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template name"
          />

          <Select value={selectedScope} onValueChange={setSelectedScope}>
            <SelectTrigger>
              <SelectValue placeholder="Select scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>System Scopes</SelectLabel>
                {systemScopes.map(scope => (
                  <SelectItem key={scope.id} value={scope.id} className="flex items-center gap-2">
                    {scope.icon && <span className="text-lg">{scope.icon}</span>}
                    {scope.name}
                  </SelectItem>
                ))}
              </SelectGroup>

              {userScopes.length > 0 && (
                <SelectGroup>
                  <SelectLabel>Custom Scopes</SelectLabel>
                  {userScopes.map(scope => (
                    <SelectItem key={scope.id} value={scope.id} className="flex items-center gap-2">
                      {scope.icon && <span className="text-lg">{scope.icon}</span>}
                      {scope.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || !selectedScope}>
            Create Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}