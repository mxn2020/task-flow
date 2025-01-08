// app/auth/signup/page.tsx

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { supabase } from '@/lib/supabaseClient';
import { hash } from 'bcryptjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { AppError } from '@/lib/errors/types';

export default function SignUp() {
 const [formData, setFormData] = useState({ email: '', password: '', name: '' });
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);
 const router = useRouter();

 const validateForm = () => {
   const { email, password, name } = formData;
   if (!email.trim()) throw new AppError('Email is required', 400, 'VALIDATION_ERROR');
   if (!password.trim()) throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
   if (!name.trim()) throw new AppError('Name is required', 400, 'VALIDATION_ERROR');
   if (!email.includes('@')) throw new AppError('Invalid email format', 400, 'VALIDATION_ERROR');
   if (password.length < 8) throw new AppError('Password must be at least 8 characters', 400, 'VALIDATION_ERROR');
 };

 const handleSignup = async (e: React.FormEvent) => {
   e.preventDefault();
   setLoading(true);
   setError('');

   try {
     validateForm();
     const { email, password, name } = formData;
     
     const { data: existingUser, error: checkError } = await supabase
       .from('profiles')
       .select('id')
       .eq('email', email)
       .single();

     if (checkError && checkError.code !== 'PGRST116') {
       throw new AppError('Database error', 500, 'DATABASE_ERROR');
     }

     if (existingUser) {
       throw new AppError('Email already in use', 409, 'DUPLICATE_EMAIL');
     }

     const hashedPassword = await hash(password, 12);
     const { error: insertError } = await supabase
       .from('profiles')
       .insert([{
         email,
         name,
         password_hash: hashedPassword
       }]);

     if (insertError) {
       throw new AppError('Failed to create account', 500, 'DATABASE_ERROR');
     }

     const result = await signIn('credentials', {
       email,
       password,
       redirect: false
     });

     if (!result?.ok) {
       throw new AppError('Failed to sign in after signup', 500, 'AUTH_ERROR');
     }

     router.push('/dashboard');
     router.refresh();
   } catch (err) {
     console.error('Signup error:', err);
     setError(err instanceof AppError ? err.message : 'An unexpected error occurred');
   } finally {
     setLoading(false);
   }
 };

 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   const { name, value } = e.target;
   setFormData(prev => ({ ...prev, [name]: value }));
 };

 return (
   <div className="min-h-screen bg-background text-foreground py-12 sm:px-6 lg:px-8 flex flex-col items-center">
     <Link 
       href="/"
       className="mb-8 text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
     >
       TaskFlow
     </Link>
     
     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
       className="w-full max-w-md"
     >
       <Card className="shadow-xl border-0">
         <CardHeader className="space-y-1 pb-8">
           <CardTitle className="text-2xl font-bold text-center">Get Started</CardTitle>
           <p className="text-center text-muted-foreground">
             Create your account to continue
           </p>
         </CardHeader>
         <CardContent>
           {error && (
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md mb-4"
             >
               <AlertCircle className="h-4 w-4" />
               <span>{error}</span>
             </motion.div>
           )}
           <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
               <label htmlFor="name" className="text-sm font-medium">Full Name</label>
               <Input
                 id="name"
                 name="name"
                 placeholder="John Doe"
                 value={formData.name}
                 onChange={handleInputChange}
                 disabled={loading}
                 aria-invalid={!!error}
                 autoComplete="name"
               />
             </div>
             <div className="space-y-2">
               <label htmlFor="email" className="text-sm font-medium">Email</label>
               <Input
                 id="email"
                 name="email"
                 type="email"
                 placeholder="you@example.com"
                 value={formData.email}
                 onChange={handleInputChange}
                 disabled={loading}
                 aria-invalid={!!error}
                 autoComplete="email"
               />
             </div>
             <div className="space-y-2">
               <label htmlFor="password" className="text-sm font-medium">Password</label>
               <Input
                 id="password"
                 name="password"
                 type="password"
                 placeholder="••••••••"
                 value={formData.password}
                 onChange={handleInputChange}
                 disabled={loading}
                 aria-invalid={!!error}
                 autoComplete="new-password"
               />
             </div>
             <Button 
               type="submit" 
               className="w-full" 
               size="lg" 
               disabled={loading}
               aria-busy={loading}
             >
               {loading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Setting up your account...
                 </>
               ) : (
                 'Create Account'
               )}
             </Button>
           </form>
           <div className="mt-6 text-center text-sm">
             <span className="text-muted-foreground">Already have an account? </span>
             <Link 
               href="/auth/signin" 
               className="font-medium text-primary hover:text-primary/80"
             >
               Sign in
             </Link>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   </div>
 );
}