'use client';

import { POSLayout } from '@/components/pos/pos-layout';
import { WithPermission } from '@/components/auth/with-permission';

export default function MenuPage() {
  return (
    <WithPermission requiredPermission="MENU_READ" redirectTo="/unauthorized">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Menu Management</h1>
        <POSLayout />
      </div>
    </WithPermission>
  );
}
