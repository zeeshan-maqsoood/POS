'use client';

import { ReactNode, Suspense } from 'react';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Toaster } from 'sonner';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { OrderNotifications } from '@/components/notifications/OrderNotifications';

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SocketProvider>
        <PermissionsProvider>
          {children}
          <OrderNotifications />
          <Toaster position="top-center" />
        </PermissionsProvider>
      </SocketProvider>
    </Suspense>
  );
}