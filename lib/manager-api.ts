import api from '@/utils/api';

// ==================
// Types
// ==================
export interface Manager {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagerData {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'KITCHEN_STAFF' | 'USER';
  status?: 'ACTIVE' | 'INACTIVE';
  permissions?: string[];
}

export interface UpdateManagerData {
  name?: string;
  email?: string;
  role?: 'ADMIN' | 'MANAGER' | 'KITCHEN_STAFF' | 'USER';
  status?: 'ACTIVE' | 'INACTIVE';
  password?: string;
  permissions?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: Manager;
}

// ==================
// Manager/Auth API
// ==================
export const managerApi = {
  // 🔑 Login
  login: (data: LoginData) => {
    return api.post<LoginResponse>('/auth/login', data);
  },

  // 👥 Get all managers (you can pass { role: 'MANAGER' } in params)
  getManagers: (params?: any) => {
    return api.get<{ data: Manager[] }>('/auth', { params });
  },

  // 📌 Get a single manager
  getManager: (id: string) => {
    return api.get<{ data: Manager }>(`/auth/${id}`);
  },

  // ➕ Create a new manager
  createManager: (data: CreateManagerData) => {
    console.log("Creating manager:", data);
    return api.post<{ data: Manager }>('/auth', data);
  },

  // ✏️ Update manager
  updateManager: (id: string, data: UpdateManagerData) => {
    return api.put<{ data: Manager }>(`/auth/${id}`, data);
  },

  // 🗑️ Delete manager
  deleteManager: (id: string) => {
    return api.delete(`/auth/${id}`);
  },

  // 🔄 Toggle manager status
  toggleManagerStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    return api.patch<{ data: Manager }>(`/auth/${id}/status`, { status });
  },

  // 🔑 Reset password
  resetPassword: (id: string, newPassword: string) => {
    return api.post(`/auth/${id}/reset-password`, { newPassword });
  },
};

export default managerApi;