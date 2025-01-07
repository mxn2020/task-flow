// app/settings/page.tsx

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import ScopeVisibilitySettings from '@/components/task/ScopeVisibilitySettings';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [error, setError] = useState('');
  const { theme, setTheme } = useTheme();

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    try {
      await supabase
        .from('profiles')
        .delete()
        .eq('id', session?.user?.id);
      
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      setError('Failed to delete account. Please try again.');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="max-w-4xl mx-auto mt-0 md:mt-16">
      {/* Desktop Page */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="hidden md:block space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Theme</span>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <ScopeVisibilitySettings />

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-destructive">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, all of your data will be permanently removed.
                This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile Page */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="md:hidden space-y-6"
      >
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Theme</h3>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Navigation</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </div>

            <ScopeVisibilitySettings />

            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, all of your data will be permanently removed.
                This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </CardContent>
      </motion.div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              This action cannot be undone. Type DELETE to confirm.
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}