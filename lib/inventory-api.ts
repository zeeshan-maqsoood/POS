import api from '@/utils/api';
import { Supplier, SupplierFormData, SupplierProduct, SupplierProductFormData } from '@/types/inventory';

// Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  branchName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  subcategories: InventorySubcategory[];
}

export interface InventorySubcategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  branchName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  category?: InventoryCategory;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  subcategoryId?: string;
  quantity: number;
  unit: string;
  cost: number;
  minStock: number;
  maxStock: number;
  supplier: string;
  location: string;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  branchName?: string;
  expiryDate?: string;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  category?: InventoryCategory;
  subcategory?: InventorySubcategory;
}

// Inventory Category API
export const inventoryCategoryApi = {
  // Get all categories
  getCategories: (params?: any) => 
    api.get<ApiResponse<InventoryCategory[]>>('/inventory/categories', { params }),
  
  // Get a single category by ID
  getCategory: (id: string) => 
    api.get<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`),
  
  // Create a new category
  createCategory: (data: Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt' | 'itemCount' | 'subcategories'>) => 
    api.post<ApiResponse<InventoryCategory>>('/inventory/categories', data),
  
  // Update a category
  updateCategory: (id: string, data: Partial<Omit<InventoryCategory, 'id' | 'createdAt' | 'updatedAt' | 'itemCount' | 'subcategories'>>) => 
    api.put<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`, data),
  
  // Delete a category
  deleteCategory: (id: string) => 
    api.delete<ApiResponse<null>>(`/inventory/categories/${id}`)
};

// Inventory Subcategory API
export const inventorySubcategoryApi = {
  // Get all subcategories
  getSubcategories: (params?: any) => 
    api.get<ApiResponse<InventorySubcategory[]>>('/inventory/subcategories', { params }),
  
  // Get a single subcategory by ID
  getSubcategory: (id: string) => 
    api.get<ApiResponse<InventorySubcategory>>(`/inventory/subcategories/${id}`),
  
  // Create a new subcategory
  createSubcategory: (data: Omit<InventorySubcategory, 'id' | 'createdAt' | 'updatedAt' | 'itemCount'>) => 
    api.post<ApiResponse<InventorySubcategory>>('/inventory/subcategories', data),
  
  // Update a subcategory
  updateSubcategory: (id: string, data: Partial<Omit<InventorySubcategory, 'id' | 'createdAt' | 'updatedAt' | 'itemCount'>>) => 
    api.put<ApiResponse<InventorySubcategory>>(`/inventory/subcategories/${id}`, data),
  
  // Delete a subcategory
  deleteSubcategory: (id: string) => 
    api.delete<ApiResponse<null>>(`/inventory/subcategories/${id}`)
};

// Inventory Item API
export const inventoryItemApi = {
  // Get all inventory items
  getItems: (params?: any) => 
    api.get<ApiResponse<InventoryItem[]>>('/inventory/items', { params }),
  
  // Get a single item by ID
  getItem: (id: string) => 
    api.get<ApiResponse<InventoryItem>>(`/inventory/items/${id}`),
  
  // Create a new item
  createItem: (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated' | 'category' | 'subcategory'>) => 
    api.post<ApiResponse<InventoryItem>>('/inventory/items', data),
  
  // Update an item
  updateItem: (id: string, data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated' | 'category' | 'subcategory'>>) => 
    api.put<ApiResponse<InventoryItem>>(`/inventory/items/${id}`, data),
  
  // Delete an item
  deleteItem: (id: string) => 
    api.delete<ApiResponse<null>>(`/inventory/items/${id}`)
};

// Supplier API
export const supplierApi = {
  // Get all suppliers
  getSuppliers: (params?: any) => 
    api.get<ApiResponse<Supplier[]>>('/inventory/suppliers', { params }),
  
  // Get a single supplier by ID
  getSupplier: (id: string) => 
    api.get<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`),
  
  // Create a new supplier
  createSupplier: (data: SupplierFormData) => 
    api.post<ApiResponse<Supplier>>('/inventory/suppliers', data),
  
  // Update a supplier
  updateSupplier: (id: string, data: Partial<SupplierFormData>) => 
    api.put<ApiResponse<Supplier>>(`/inventory/suppliers/${id}`, data),
  
  // Delete a supplier
  deleteSupplier: (id: string) => 
    api.delete<ApiResponse<null>>(`/inventory/suppliers/${id}`),

  // Get supplier products
  getSupplierProducts: (supplierId: string, params?: any) => 
    api.get<ApiResponse<SupplierProduct[]>>(`/inventory/suppliers/${supplierId}/products`, { params }),

  // Add product to supplier
  addProductToSupplier: (supplierId: string, data: SupplierProductFormData & { inventoryItemId: string }) => 
    api.post<ApiResponse<SupplierProduct>>(`/inventory/suppliers/${supplierId}/products`, data),

  // Update supplier product
  updateSupplierProduct: (supplierProductId: string, data: Partial<SupplierProductFormData>) => 
    api.put<ApiResponse<SupplierProduct>>(`/inventory/supplier-products/${supplierProductId}`, data),

  // Remove product from supplier
  removeSupplierProduct: (supplierProductId: string) => 
    api.delete<ApiResponse<null>>(`/inventory/supplier-products/${supplierProductId}`)
};

// Export all APIs
export default {
  category: inventoryCategoryApi,
  subcategory: inventorySubcategoryApi,
  item: inventoryItemApi,
  supplier: supplierApi
};