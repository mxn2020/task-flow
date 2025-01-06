// app/profile/page.tsx

'use client';

import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save } from 'lucide-react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setName(data.name || '');
      setEmail(data.email);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await supabase.from('profiles').update({ name }).eq('id', userId);
      setStatus({ message: 'Profile updated successfully', type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    } catch {
      setStatus({ message: 'Failed to update profile', type: 'error' });
    }
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
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
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
                  className={`p-4 rounded-md ${
                    status.type === 'success' 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {status.message}
                </motion.div>
              )}

              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}