import api from '@/utils/api';

// Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder: number;
  branchName: string;
  createdAt: string;
  updatedAt: string;
  menuItems?: MenuItem[];
}

export interface ModifierOption {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface Modifier {
  id: string;
  name: string;
  description?: string;
  type: 'SINGLE' | 'MULTIPLE' | 'QUANTITY';
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
  options: ModifierOption[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
    id: string
    name: string
    description?: string
    imageUrl?: string
    price: number
    taxRate: number
    taxExempt: boolean
    isActive: boolean
    categoryId: string
    tags?: string[]
    branchName?: string
    createdAt: string
    updatedAt: string
    category?: { id: string; name: string }
    modifiers?: { id: string; name: string; price: number; isActive: boolean }[]
  }
  

// Category API
export const categoryApi = {
  // Get all categories
  getCategories: (params?: any) => api.get<ApiResponse<Category[]>>('/menu/categories', { params }),
  
  // Get a single category by ID
  getCategory: (id: string) => api.get<ApiResponse<Category>>(`/menu/categories/${id}`),
  
  // Create a new category
  createCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Category>>('/menu/categories', data),
  
  // Update a category
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<ApiResponse<Category>>(`/menu/categories/${id}`, data),
  
  // Delete a category
  deleteCategory: (id: string) => api.delete<ApiResponse<null>>(`/menu/categories/${id}`)
};

// Menu Item API
export const menuItemApi = {
    // Create a new menu item
    createItem: (data: Partial<MenuItem>) => api.post<ApiResponse<MenuItem>>("/menu/items", data),
  
    // Get all menu items
    getItems: (params?: any) => api.get<ApiResponse<MenuItem[]>>("/menu/items", { params }),
  
    // Get a single item
    getItem: (id: string) => api.get<ApiResponse<MenuItem>>(`/menu/items/${id}`),
  
    // Update an item
    updateItem: (id: string, data: Partial<MenuItem>) =>
      api.put<ApiResponse<MenuItem>>(`/menu/items/${id}`, data),
  
    // Delete an item
    deleteItem: (id: string) => api.delete<ApiResponse<null>>(`/menu/items/${id}`),
  }

// Modifier API
export const modifierApi = {
  // Get all modifiers
  getModifiers: (params?: any) => api.get<ApiResponse<Modifier[]>>('/menu/modifiers', { params }),
  
  // Get a single modifier by ID
  getModifier: (id: string) => api.get<ApiResponse<Modifier>>(`/menu/modifiers/${id}`),
  
  // Create a new modifier
  createModifier: (data: Omit<Modifier, 'id' | 'createdAt' | 'updatedAt' | 'options'> & { options: Omit<ModifierOption, 'id'>[] }) => 
    api.post<ApiResponse<Modifier>>('/menu/modifiers', data),
  
  // Update a modifier
  updateModifier: (id: string, data: Partial<Omit<Modifier, 'id' | 'createdAt' | 'updatedAt' | 'options'>> & { options?: Omit<ModifierOption, 'id'>[] }) => 
    api.put<ApiResponse<Modifier>>(`/menu/modifiers/${id}`, data),
  
  // Delete a modifier
  deleteModifier: (id: string) => api.delete<ApiResponse<null>>(`/menu/modifiers/${id}`),
  
  // Toggle modifier status
  toggleModifierStatus: (id: string, isActive: boolean) => 
    api.patch<ApiResponse<Modifier>>(`/menu/modifiers/${id}/status`, { isActive })
};

export default {
  category: categoryApi,
  menuItem: menuItemApi,
  modifier: modifierApi
};
