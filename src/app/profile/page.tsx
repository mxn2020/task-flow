// app/profile/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, AlertCircle } from 'lucide-react';
import { AppError } from '@/lib/errors/types';

interface Profile {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<Profile>({ name: '', email: '' });
  const [status, setStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw new AppError('Failed to load profile', 500, 'FETCH_ERROR');
      
      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setStatus({
        message: err instanceof AppError ? err.message : 'Failed to load profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      if (!profile.name.trim()) {
        throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
      }

      const { error } = await supabase
        .from('profiles')
        .update({ name: profile.name.trim() })
        .eq('id', userId);

      if (error) throw new AppError('Failed to update profile', 500, 'UPDATE_ERROR');

      setStatus({ message: 'Profile updated successfully', type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setStatus({
        message: err instanceof AppError ? err.message : 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-0 md:mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfile} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your name"
                  aria-invalid={status?.type === 'error'}
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  value={profile.email}
                  readOnly
                  disabled
                  className="bg-secondary"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {status && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`flex items-center gap-2 p-4 rounded-md ${
                    status.type === 'success' 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
                  {status.message}
                </motion.div>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}