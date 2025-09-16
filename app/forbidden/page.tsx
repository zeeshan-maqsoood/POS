'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-6 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">403 - Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to access this page.
        </p>
      </div>
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
        <Button onClick={() => router.push('/')}>
          Return Home
        </Button>
      </div>
    </div>
  );
}
