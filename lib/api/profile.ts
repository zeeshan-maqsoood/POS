import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const getProfile = async (): Promise<ApiResponse<User>> => {
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
