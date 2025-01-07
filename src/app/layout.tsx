// app/layout.tsx

import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';
import { OfflineProvider } from '@/components/app/OfflineProvider';
import { InstallPrompt } from '@/components/app/InstallPrompt';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import TanstackProvider from '@/contexts/TanstackProvider';
import Script from 'next/script';
import { MenuProvider } from '@/contexts/MenuContext';
import { ErrorBoundary } from '@/components/app/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'NextStack Pro',
  description: 'A modern, full-stack Next.js template with authentication, database, caching, and PWA support',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NextStack Pro",
  },
  icons: {
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
      { url: '/icons/icon-512x512.png', sizes: '512x512' },
    ],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
  },
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-192x192.png"
          sizes="192x192"
        />
        <link
          rel="apple-touch-icon"
          href="/icons/icon-512x512.png"
          sizes="512x512"
        />
        <Script id="register-sw" strategy="lazyOnload">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async function() {
                try {
                  const registration = await navigator.serviceWorker.register('/sw.js');
                  console.log('Service Worker registration successful:', registration.scope);
                } catch (error) {
                  console.error('Service Worker registration failed:', error);
                }
              });
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TanstackProvider>
              <MenuProvider>
                <ClientLayout>
                  <NotificationProvider>
                    <OfflineProvider>
                      <div className="page-transition">
                        {children}
                      </div>
                      <InstallPrompt />
                    </OfflineProvider>
                  </NotificationProvider>
                </ClientLayout>
              </MenuProvider>
            </TanstackProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}