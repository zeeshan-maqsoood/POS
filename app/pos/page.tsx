'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { POSLayout } from '@/components/pos/pos-layout';

export default function POSPage() {
  const router = useRouter();
  const { hasRole, isLoading } = usePermissions();

  // Check if user is authorized (ADMIN or MANAGER role required)
  const isAuthorized = hasRole('ADMIN') || hasRole('MANAGER');
  
  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      // Redirect to unauthorized or dashboard if not authorized
      router.push('/dashboard?error=unauthorized');
    }
  }, [isAuthorized, isLoading, router]);

  // Show loading state while checking permissions
  if (isLoading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <POSLayout />
    </div>
  );
}
