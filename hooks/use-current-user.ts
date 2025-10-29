import { useState, useEffect } from 'react';
import { Manager } from '@/lib/manager-api';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<Manager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const data = await response.json();
        setCurrentUser(data);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  return { currentUser, isLoading, error };
}
