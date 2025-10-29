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
        
        // Type assertion to handle the API response
        type ApiResponse = {
          id: string;
          email: string;
          name: string;
          role: string;
          branch?: any; // We'll handle this carefully
          permissions?: string[];
        };

        const responseData = response as unknown as { data: ApiResponse };
        
        if (responseData?.data) {
          const userData = responseData.data?.data;
          console.log(userData,"userData")
          // Debug log the raw user data
          console.log('Raw user data from API:', userData);
          
          // Safely extract branch information
          let branchValue: string | undefined;
          if (userData.branch) {
            if (typeof userData.branch === 'string') {
              branchValue = userData.branch;
            } else if (userData.branch.name) {
              branchValue = userData.branch.name;
            } else if (userData.branch.id) {
              branchValue = userData.branch.id;
            }
          }
          
          const userInfo: User = {
            userId: userData.id,
            email: userData.email,
            name: userData.name,
            role: (userData.role || 'CUSTOMER') as User['role'],
            branch: branchValue,
            permissions: userData.permissions || []
          };
console.log(userInfo,"userInfo")
          console.log('Processed user info:', {
            ...userInfo,
            branchType: typeof userInfo.branch,
            branchValue: userInfo.branch
          });

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
    isLoading: loading, // For backward compatibility
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => roles.some(role => user?.role === role)
  };
}
