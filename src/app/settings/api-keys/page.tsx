// app/settings/api-keys/page.tsx

'use client'

import React, { useState, useEffect } from 'react';

'use client';

import React, { JSX, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Copy, AlertCircle, Check } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/app/ConfirmationDialog';
import { APIKey, CreateAPIKeyResponse, NewKeyState } from '@/types/api-keys';

const initialKeyState: NewKeyState = {
  name: '',
  expiresInDays: 30,
  permissions: { read: true, write: false },
  rateLimit: 1000,
  noExpiration: false
};

export default function APIKeys(): JSX.Element {
  const { data: session } = useSession();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageError, setPageError] = useState<string>('');
  const [dialogError, setDialogError] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newKeyDetails, setNewKeyDetails] = useState<NewKeyState>(initialKeyState);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [keyToDelete, setKeyToDelete] = useState<APIKey | null>(null);

  useEffect(() => {
    void loadApiKeys();
  }, []);

  const loadApiKeys = async (): Promise<void> => {
    try {
      const response = await fetch('/api/keys');
      if (!response.ok) throw new Error('Failed to load API keys');
      const data = await response.json() as APIKey[];
      setKeys(data);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (): Promise<void> => {
    try {
      if (keys.some(key => key.name === newKeyDetails.name)) {
        throw new Error('Key name already exists');
      }

      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newKeyDetails,
          expiresInDays: newKeyDetails.noExpiration ? null : newKeyDetails.expiresInDays
        })
      });
      
      if (!response.ok) throw new Error('Failed to create API key');
      
      const data = await response.json() as CreateAPIKeyResponse;
      setNewKey(data.key);
      await loadApiKeys();
    } catch (err) {
      setDialogError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (): Promise<void> => {
    if (!keyToDelete) return;

    try {
      const response = await fetch(`/api/keys/${keyToDelete.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to revoke API key');
      
      await loadApiKeys();
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const handleCopyKey = async (key: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    } catch (err) {
      setDialogError('Failed to copy key to clipboard');
    }
  };

  const closeNewKeyDialog = (): void => {
    setDialogError('');
    setNewKey(null);
    setIsCreateDialogOpen(false);
    setNewKeyDetails(initialKeyState);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>API Keys</CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pageError && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{pageError}</span>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key Prefix</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>{key.prefix}...</TableCell>
                  <TableCell>
                    {[
                      key.permissions.read && 'Read',
                      key.permissions.write && 'Write'
                    ].filter(Boolean).join(', ')}
                  </TableCell>
                  <TableCell>{key.rateLimit}/day</TableCell>
                  <TableCell>
                    {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setKeyToDelete(key);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            {dialogError && (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md mt-2">
                <AlertCircle className="h-4 w-4" />
                <span>{dialogError}</span>
              </div>
            )}
            <DialogTitle>Create New API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                value={newKeyDetails.name}
                onChange={(e) => setNewKeyDetails({
                  ...newKeyDetails,
                  name: e.target.value
                })}
                placeholder="My API Key"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newKeyDetails.noExpiration}
                  onCheckedChange={(checked: boolean) => setNewKeyDetails({
                    ...newKeyDetails,
                    noExpiration: checked
                  })}
                />
                <Label>No Expiration</Label>
              </div>
              
              {!newKeyDetails.noExpiration && (
                <div>
                  <Label htmlFor="expiry">Expires In (Days)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    value={newKeyDetails.expiresInDays}
                    onChange={(e) => setNewKeyDetails({
                      ...newKeyDetails,
                      expiresInDays: parseInt(e.target.value) || 0
                    })}
                    min="1"
                    max="365"
                  />
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="rateLimit">Rate Limit (Requests/Day)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={newKeyDetails.rateLimit}
                onChange={(e) => setNewKeyDetails({
                  ...newKeyDetails,
                  rateLimit: parseInt(e.target.value) || 0
                })}
                min="1"
                max="10000"
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newKeyDetails.permissions.read}
                  onCheckedChange={(checked: boolean) => setNewKeyDetails({
                    ...newKeyDetails,
                    permissions: { ...newKeyDetails.permissions, read: checked }
                  })}
                />
                <Label>Read</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newKeyDetails.permissions.write}
                  onCheckedChange={(checked: boolean) => setNewKeyDetails({
                    ...newKeyDetails,
                    permissions: { ...newKeyDetails.permissions, write: checked }
                  })}
                />
                <Label>Write</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => void handleCreateKey()}>Create Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {newKey && (
        <Dialog open={true} onOpenChange={() => setNewKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Make sure to copy your API key now. You won&apos;t be able to see it again!
              </p>
              <div className="flex items-center space-x-2">
                <Input value={newKey} readOnly />
                <Button size="icon" onClick={() => handleCopyKey(newKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
      <Dialog open={!!newKey} onOpenChange={closeNewKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Make sure to copy your API key now. You won't be able to see it again!
            </p>
            <div className="flex items-center space-x-2">
              <Input value={newKey ?? ''} readOnly />
              <AnimatePresence mode="wait">
                {copiedKey ? (
                  <motion.div
                    key="check"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button size="icon" variant="outline" className="bg-green-500 text-white">
                      <Check className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button 
                      size="icon" 
                      onClick={() => newKey && void handleCopyKey(newKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={closeNewKeyDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog
        type="delete"
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={async () => {
          await handleRevokeKey();
        }}
        title={keyToDelete?.name ?? ''}
      />
    </div>
  );
}