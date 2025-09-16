'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cookies } from 'next/headers';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      if (!token) {
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
