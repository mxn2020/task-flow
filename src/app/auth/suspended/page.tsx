// app/auth/suspended/page.tsx
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export default function SuspendedPage() {
 return (
   <div className="min-h-screen bg-background text-foreground py-12 sm:px-6 lg:px-8 flex flex-col items-center">
     <Link 
       href="/"
       className="mb-8 text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
     >
       NextStack Pro
     </Link>

     <motion.div
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ duration: 0.3 }}
       className="w-full max-w-md"
     >
       <Card className="shadow-xl border-0">
         <CardHeader className="space-y-1 pb-8">
           <CardTitle className="text-2xl font-bold text-center">Account Suspended</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center gap-2 bg-destructive/10 text-destructive p-3 rounded-md">
             <AlertCircle className="h-4 w-4" />
             <span>Your account has been suspended. Please contact support for assistance.</span>
           </div>
           <Button asChild className="w-full">
             <Link href="/auth/signin">Return to Sign In</Link>
           </Button>
         </CardContent>
       </Card>
     </motion.div>
   </div>
 );
}