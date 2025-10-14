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

export interface Modifier {
  type: string;
  minSelection: number;
  maxSelection: number;
  modifierIngredients: any;
  id: string;
  name: string;
  description?: string;
  price: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  menuItemIngredients: boolean;
  ingredients: boolean;
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
  modifiers?: {
  modifier: {
    type: string; id: string; name: string; price: number; isActive: boolean; 
};
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}[]
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
  modifiers?: {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}[]
}

// Add Prisma nested operations types
export interface MenuItemNestedOperations {
modifiers?: {
  connect?: { id: string }[];
  create?: Array<{
    name: string;
    description?: string;
    price: number;
    type?: string;
    isRequired?: boolean;
    isActive?: boolean;
  }>;
  deleteMany?: {};
};
ingredients?: {
  create?: Array<{
    inventoryItemId: string;
    quantity: number;
    unit: string;
  }>;
  deleteMany?: {};
};
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
  createModifier: (data: Omit<Modifier, 'id' | 'createdAt' | 'updatedAt'>) => 
    api.post<ApiResponse<Modifier>>('/menu/modifiers', data),
  
  // Update a modifier
  updateModifier: (id: string, data: Partial<Omit<Modifier, 'id' | 'createdAt' | 'updatedAt'>>) => 
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
