'use client';

import Link from 'next/link';
import { WithPermission } from '@/components/auth/with-permission';

export default function MenuPage() {
  return (
    <WithPermission requiredPermission="MENU_READ" redirectTo="/unauthorized">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Menu Management</h1>

        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/menu/items" className="block p-6 rounded-lg border hover:shadow-sm transition">
            <h2 className="text-lg font-semibold mb-2">Items</h2>
            <p className="text-sm text-muted-foreground">Create, edit, and manage menu items.</p>
          </Link>

          <Link href="/dashboard/menu/categories" className="block p-6 rounded-lg border hover:shadow-sm transition">
            <h2 className="text-lg font-semibold mb-2">Categories</h2>
            <p className="text-sm text-muted-foreground">Organize items into categories.</p>
          </Link>

          <Link href="/dashboard/menu/modifiers" className="block p-6 rounded-lg border hover:shadow-sm transition">
            <h2 className="text-lg font-semibold mb-2">Modifiers</h2>
            <p className="text-sm text-muted-foreground">Options and add-ons for items.</p>
          </Link>
        </div>
      </div>
    </WithPermission>
  );
}
