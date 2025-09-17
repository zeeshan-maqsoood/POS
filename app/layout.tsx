import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
// Custom auth utilities will be used client-side
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
  generator: 'v0.app',
}

import { Permission } from '@/contexts/PermissionsContext';
import { Suspense } from 'react';

// Permissions will be set client-side after authentication
const initialPermissions: Permission[] = [];

// Create a client component wrapper for the providers
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PermissionsProvider permissions={initialPermissions}>
      {children}
      <Analytics />
      <Toaster position="top-center" />
    </PermissionsProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            {children}
          </Providers>
        </Suspense>
      </body>
    </html>
  )
}
