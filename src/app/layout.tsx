// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ClientLayout from './ClientLayout';
import { OfflineProvider } from '@/components/app/offline-provider';
import { InstallPrompt } from '@/components/app/InstallPrompt';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { NotificationProvider } from '@/contexts/notification-context';
import TanstackProvider from '@/contexts/TanstackProvider';
import Script from 'next/script';
import { MenuProvider } from '@/contexts/MenuContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TaskFlow',
  description: 'A powerful todo list and brainstorming PWA',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TaskFlow",
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  }
};

export const viewport = {
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover'
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <Script id="register-sw" strategy="lazyOnload">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful');
                  },
                  function(err) {
                    console.log('Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
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
      </body>
    </html>
  );
}

