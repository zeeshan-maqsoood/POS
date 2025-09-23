import { useState, useEffect } from 'react';
import profileApi from '@/lib/profile-api';

export interface User {
  userId: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN_STAFF' | 'CUSTOMER';
  branch?: string;
  permissions: string[];
  name: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        // Check if we have a token first
        const token = localStorage.getItem('token') || document.cookie.split(';')
          .find(row => row.trim().startsWith('token='))?.split('=')[1];

        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Fetch user profile from backend
        const response = await profileApi.getProfile();

        if (response.data?.data) {
          const userData = response.data.data;
          const userInfo: User = {
            userId: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role as User['role'],
            branch: userData.branch || undefined,
            permissions: userData.permissions || []
          };

          setUser(userInfo);

          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify({
            ...userInfo,
            token: token // Keep the token
          }));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  return {
    user,
    loading,
    isAdmin,
    isManager,
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.includes(user?.role || '')
  };
}
