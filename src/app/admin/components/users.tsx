// app/admin/notifications/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  role: 'user' | 'admin' | 'superadmin';
  is_suspended: boolean;
  last_sign_in: string | null;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    void fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Profile['role']): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleStatusChange = async (userId: string, isSuspended: boolean): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: isSuspended })
        .eq('id', userId);
      
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(search.toLowerCase()) ||
    user.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: Profile['role']) => void handleRoleChange(user.id, value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_suspended ? 'destructive' : 'secondary'}>
                  {user.is_suspended ? 'Suspended' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.last_sign_in ? new Date(user.last_sign_in).toLocaleDateString() : 'Never'}
              </TableCell>
              <TableCell>
                <Button
                  variant={user.is_suspended ? 'default' : 'destructive'}
                  onClick={() => void handleStatusChange(user.id, !user.is_suspended)}
                >
                  {user.is_suspended ? 'Activate' : 'Suspend'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserManagement;