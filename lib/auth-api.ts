import api from "@/utils/api";

// ==================
// Types
// ==================

// Configure axios to send cookies with every request
api.defaults.withCredentials = true;
export interface LoginData {
  email: string;
  password: string;
}

export type UserRole = "ADMIN" | "MANAGER" | "KITCHEN_STAFF" | "CUSTOMER";

export type Permission = string; // Import this from your permissions file if you have one

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: {
    user: User;
    token: string;
  };
}

// ==================
// Auth API
// ==================
interface AuthApi {
  login: (data: LoginData) => Promise<LoginResponse>;
  logout: () => Promise<{ success: boolean; message: string }>;
  me: () => Promise<any>;
}

export const authApi: AuthApi = {
  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/auth/logout`);
      return response.data;
    } catch (error: any) {
      // Even if the API call fails, we still want to clear local state
      return { success: false, message: error.response?.data?.message || 'Logout failed' };
    }
  },
  login: async (data: LoginData): Promise<LoginResponse> => {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/login`;
    console.log('Login request to:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      console.log('Response status:', response.status, response.statusText);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('Response data:', responseData);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        const errorInfo = {
          status: response.status,
          statusText: response.statusText,
          url: apiUrl,
          response: responseData,
        };
        console.error('Login error:', errorInfo);
        throw new Error(
          responseData.message || 
          `Login failed: ${response.status} ${response.statusText}`
        );
      }

      if (!responseData.data?.token) {
        console.error('Missing token in response:', responseData);
        throw new Error('Authentication token not received');
      }

      return responseData;
    } catch (error) {
      console.error('Login request failed:', {
        error,
        url: apiUrl,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  },

  me: () => {
    return api.get<LoginResponse>("/auth/me");
  },
};

export default authApi;