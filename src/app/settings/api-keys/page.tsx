// app/settings/api-keys/page.tsx
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, Key, Trash2, Copy, AlertCircle } from 'lucide-react';
import { APIKey, CreateAPIKeyRequest } from '@/types/api-keys';

interface NewKeyState extends CreateAPIKeyRequest {
  expiresInDays: number;
}

export default function APIKeys() {
  const { data: session } = useSession();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyDetails, setNewKeyDetails] = useState<NewKeyState>({
    name: '',
    expiresInDays: 30,
    permissions: { read: true, write: false },
    rateLimit: 1000
  });
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async (): Promise<void> => {
    try {
      const response = await fetch('/api/keys');
      if (!response.ok) throw new Error('Failed to load API keys');
      const data = await response.json() as APIKey[];
      setKeys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (): Promise<void> => {
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyDetails)
      });
      
      if (!response.ok) throw new Error('Failed to create API key');
      
      const data = await response.json() as { key: string };
      setNewKey(data.key);
      await loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    }
  };

  const handleRevokeKey = async (keyId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to revoke API key');
      
      await loadApiKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    }
  };

  const handleCopyKey = (key: string): void => {
    navigator.clipboard.writeText(key);
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
          {error && (
            <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
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
                    {key.permissions.read ? 'Read' : ''} 
                    {key.permissions.write ? 'Write' : ''}
                  </TableCell>
                  <TableCell>{key.rateLimit}/day</TableCell>
                  <TableCell>
                    {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleRevokeKey(key.id)}
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
            
            <div>
              <Label htmlFor="expiry">Expires In (Days)</Label>
              <Input
                id="expiry"
                type="number"
                value={newKeyDetails.expiresInDays}
                onChange={(e) => setNewKeyDetails({
                  ...newKeyDetails,
                  expiresInDays: parseInt(e.target.value)
                })}
                min="1"
                max="365"
              />
            </div>

            <div>
              <Label htmlFor="rateLimit">Rate Limit (Requests/Day)</Label>
              <Input
                id="rateLimit"
                type="number"
                value={newKeyDetails.rateLimit}
                onChange={(e) => setNewKeyDetails({
                  ...newKeyDetails,
                  rateLimit: parseInt(e.target.value)
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
                  onCheckedChange={(checked) => setNewKeyDetails({
                    ...newKeyDetails,
                    permissions: { ...newKeyDetails.permissions, read: checked }
                  })}
                />
                <Label>Read</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newKeyDetails.permissions.write}
                  onCheckedChange={(checked) => setNewKeyDetails({
                    ...newKeyDetails,
                    permissions: { ...newKeyDetails.permissions, write: checked }
                  })}
                />
                <Label>Write</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateKey}>Create Key</Button>
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
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
              <div className="flex items-center space-x-2">
                <Input value={newKey} readOnly />
                <Button size="icon" onClick={() => handleCopyKey(newKey)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

