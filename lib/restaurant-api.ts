import api from '@/utils/api';

// ==================
// Types
// ==================
export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  operatingHours?: any;
  businessType?: string;
  cuisine: string[];
  establishedYear?: number;
  createdAt: string;
  updatedAt: string;
  branches?: Array<{
    id: string;
    name: string;
    isActive: boolean;
    _count?: {
      users: number;
      orders: number;
      menuItems: number;
      shifts: number;
      inventoryItems: number;
    };
  }>;
  _count?: {
    branches: number;
  };
}

export interface CreateRestaurantData {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  businessType?: string;
  cuisine?: string[];
  establishedYear?: number;
  operatingHours?: any;
}

export interface UpdateRestaurantData {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  businessType?: string;
  cuisine?: string[];
  establishedYear?: number;
  operatingHours?: any;
  isActive?: boolean;
}

export interface RestaurantStats {
  id: string;
  name: string;
  isActive: boolean;
  stats: {
    totalBranches: number;
    totalUsers: number;
    totalOrders: number;
    totalMenuItems: number;
    totalShifts: number;
    totalInventoryItems: number;
    revenueLast30Days: number;
    orderCountLast30Days: number;
  };
}

// ==================
// Restaurant API
// ==================
export const restaurantApi = {
  // 📋 Get all restaurants
  getAllRestaurants: () => {
    return api.get<{ data: Restaurant[] }>('/restaurants');
  },

  // ✅ Get all active restaurants
  getActiveRestaurants: () => {
    return api.get<{ data: Restaurant[] }>('/restaurants/active');
  },

  // 🔍 Get specific restaurant by ID
  getRestaurantById: (id: string) => {
    return api.get<{ data: Restaurant }>(`/restaurants/${id}`);
  },

  // 📊 Get restaurant statistics
  getRestaurantStats: (id: string) => {
    return api.get<{ data: RestaurantStats }>(`/restaurants/${id}/stats`);
  },

  // ➕ Create new restaurant (admin only)
  createRestaurant: (data: CreateRestaurantData) => {
    return api.post<{ data: Restaurant }>('/restaurants', data);
  },

  // ✏️ Update restaurant (admin only)
  updateRestaurant: (id: string, data: UpdateRestaurantData) => {
    return api.put<{ data: Restaurant }>(`/restaurants/${id}`, data);
  },

  // 🗑️ Delete/deactivate restaurant (admin only)
  deleteRestaurant: (id: string) => {
    return api.delete(`/restaurants/${id}`);
  },

  // 📋 Get restaurants for dropdown
  getRestaurantsForDropdown: () => {
    return api.get<{ data: Restaurant[] }>('/restaurants/dropdown');
  },
};

export default restaurantApi;
