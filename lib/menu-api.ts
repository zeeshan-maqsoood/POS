import api from '@/utils/api';

// Types
export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
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
    createdAt: string
    updatedAt: string
    category?: { id: string; name: string }
    modifiers?: { id: string; name: string; price: number; isActive: boolean }[]
  }
  

// Category API
export const categoryApi = {
  // Get all categories
  getCategories: (params?: any) => api.get<Category[]>('/menu/categories', { params }),
  
  // Get a single category by ID
  getCategory: (id: string) => api.get<Category>(`/menu/categories/${id}`),
  
  // Create a new category
  createCategory: (data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<Category>('/menu/categories', data),
  
  // Update a category
  updateCategory: (id: string, data: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>) => 
    api.put<Category>(`/menu/categories/${id}`, data),
  
  // Delete a category
  deleteCategory: (id: string) => api.delete(`/menu/categories/${id}`)
};

// Menu Item API
export const menuItemApi = {
    // Create a new menu item
    createItem: (data: Partial<MenuItem>) => api.post("/menu/items", data),
  
    // Get all menu items
    getItems: (params?: any) => api.get("/menu/items", { params }),
  
    // Get a single item
    getItem: (id: string) => api.get(`/menu/items/${id}`),
  
    // Update an item
    updateItem: (id: string, data: Partial<MenuItem>) =>
      api.put(`/menu/items/${id}`, data),
  
    // Delete an item
    deleteItem: (id: string) => api.delete(`/menu/items/${id}`),
  }

// Modifier API
export const modifierApi = {
  // Get all modifiers
  getModifiers: (params?: any) => api.get<Modifier[]>('/menu/modifiers', { params }),
  
  // Get a single modifier by ID
  getModifier: (id: string) => api.get<Modifier>(`/menu/modifiers/${id}`),
  
  // Create a new modifier
  createModifier: (data: Omit<Modifier, 'id' | 'createdAt' | 'updatedAt' | 'options'> & { options: Omit<ModifierOption, 'id'>[] }) => 
    api.post<Modifier>('/menu/modifiers', data),
  
  // Update a modifier
  updateModifier: (id: string, data: Partial<Omit<Modifier, 'id' | 'createdAt' | 'updatedAt' | 'options'>> & { options?: Omit<ModifierOption, 'id'>[] }) => 
    api.put<Modifier>(`/menu/modifiers/${id}`, data),
  
  // Delete a modifier
  deleteModifier: (id: string) => api.delete(`/menu/modifiers/${id}`),
  
  // Toggle modifier status
  toggleModifierStatus: (id: string, isActive: boolean) => 
    api.patch<Modifier>(`/menu/modifiers/${id}/status`, { isActive })
};

export default {
  category: categoryApi,
  menuItem: menuItemApi,
  modifier: modifierApi
};
