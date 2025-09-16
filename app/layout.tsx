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

// Permissions will be set client-side after authentication
const initialPermissions: Permission[] = [];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Initialize with empty permissions, will be updated after login
  const userPermissions = initialPermissions;

  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <PermissionsProvider permissions={userPermissions}>
          {children}
          <Analytics />
          <Toaster position="top-center" />
        </PermissionsProvider>
      </body>
    </html>
  )
}
