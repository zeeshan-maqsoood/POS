import api from '@/utils/api';

// ==================
// Types
// ==================
export interface Branch {
  id: string;
  name: string;
  restaurantId: string;
  restaurant?: {
    id: string;
    name: string;
  };
  restaurantName?: string; // Keep for display purposes
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  manager?: string;
  isActive: boolean;
  serviceType: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH';
  operatingHours?: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    orders: number;
    menuItems: number;
    shifts: number;
    inventoryItems: number;
  };
}

export interface CreateBranchData {
  name: string;
  restaurantId: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  manager?: string;
  operatingHours?: any;
  isActive?: boolean;
  serviceType?: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH';
}

export interface UpdateBranchData {
  name?: string;
  restaurantId?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  manager?: string;
  operatingHours?: any;
  isActive?: boolean;
  serviceType?: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH';
}

export interface BranchStats {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName?: string;
  isActive: boolean;
  serviceType?: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH';
  stats: {
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
// Branch API
// ==================
export const branchApi = {
  // 📋 Get all branches
  getAllBranches: () => {
    return api.get<Branch[]>('/branches');
  },

  // ✅ Get all active branches
  getActiveBranches: () => {
    return api.get<Branch[]>('/branches/active');
  },

  // 👤 Get branches for current user
  getUserBranches: () => {
    return api.get<Branch[]>('/branches/user');
  },

  // 📋 Get branches for dropdown
  async getBranchesForDropdown() {
    try {
      console.log('Fetching branches for dropdown...');
      const response = await api.get<Array<{ id: string; name: string; value: string; restaurantName?: string }>>('/branches/dropdown');
      console.log('Branches API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching branches for dropdown:', error);
      throw error;
    }
  },

  // 📋 Get branches for a specific restaurant
  getBranchesByRestaurant: (restaurantId: string) => {
    return api.get<Branch[]>(`/branches/restaurant/${restaurantId}`);
  },

  // 🔍 Get specific branch by ID
  getBranchById: (id: string) => {
    return api.get<Branch>(`/branches/${id}`);
  },

  // 📊 Get branch statistics
  getBranchStats: (id: string) => {
    return api.get<BranchStats>(`/branches/${id}/stats`);
  },

  // ➕ Create new branch (admin only)
  createBranch: (data: CreateBranchData) => {
    return api.post<Branch>('/branches', data);
  },

  // ✏️ Update branch (admin only)
  updateBranch: (id: string, data: UpdateBranchData) => {
    return api.put<Branch>(`/branches/${id}`, data);
  },

  // 🗑️ Delete/deactivate branch (admin only)
  deleteBranch: (id: string) => {
    return api.delete(`/branches/${id}`);
  },
};

export default branchApi;
