import api from '@/utils/api';

export interface RestaurantUser {
  id: string;
  email: string;
  name?: string;
  role: 'RESTAURANT';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  restaurantId?: string;
  restaurant?: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    isActive: boolean;
    businessType?: string;
    cuisine: string[];
    establishedYear?: number;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    restaurantId?: string;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantLoginData {
  email: string;
  password: string;
}

export interface RestaurantAuthResponse {
  user: RestaurantUser;
  token: string;
  restaurant: {
    id: string;
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    country: string;
    phone?: string;
    email?: string;
    website?: string;
    logoUrl?: string;
    isActive: boolean;
    businessType?: string;
    cuisine: string[];
    establishedYear?: number;
  };
}

// ==================
// Restaurant Auth API
// ==================
export const restaurantAuthApi = {
  // 🔐 Restaurant login
  login: (data: RestaurantLoginData) => {
    return api.post<{ data: RestaurantAuthResponse }>('/restaurant/auth/login', data);
  },

  // 🚪 Restaurant logout
  logout: () => {
    return api.post('/restaurant/auth/logout');
  },

  // 👤 Get restaurant profile
  getProfile: () => {
    return api.get<{ data: RestaurantUser }>('/restaurant/auth/profile');
  },
};

export default restaurantAuthApi;
