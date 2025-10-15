export interface InventoryItem {
  id: string
  name: string
  description?: string
  categoryId: string
  subcategoryId?: string
  quantity: number
  unit: string
  cost: number
  minStock: number
  maxStock: number
  supplier: string
  location: string
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
  branchName?: string
  expiryDate?: string
  lastUpdated: string
  createdAt: string
  updatedAt: string
  category?: InventoryCategory
  subcategory?: InventorySubcategory
}

export type InventoryStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"

export interface InventoryCategory {
  id: string
  name: string
  description?: string
  color: string
  branchName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  itemCount: number
  subcategories: InventorySubcategory[]
}

export interface InventorySubcategory {
  id: string
  name: string
  description?: string
  categoryId: string
  branchName?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  itemCount: number
  category?: InventoryCategory
}

// Request DTOs for forms
export interface InventoryFormData {
  name: string
  description?: string
  categoryId: string
  subcategoryId?: string
  quantity: number
  unit: string
  cost: number
  minStock: number
  maxStock: number
  supplier: string
  location: string
  status: InventoryStatus
  expiryDate?: string
}

export interface CategoryFormData {
  name: string
  description?: string
  color: string
  branchName?: string
}

export interface SubcategoryFormData {
  name: string
  description?: string
  categoryId: string
  branchName?: string
}

// Default categories for initial setup
export const defaultCategories: InventoryCategory[] = [
  {
    id: "1",
    name: "Produce",
    description: "Fresh fruits and vegetables",
    color: "bg-green-500",
    isActive: true,
    branchName: "Main Branch",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    itemCount: 15,
    subcategories: [
      { 
        id: "1-1", 
        name: "Vegetables", 
        description: "Fresh vegetables",
        categoryId: "1",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 8 
      },
      { 
        id: "1-2", 
        name: "Fruits", 
        description: "Fresh fruits",
        categoryId: "1",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 5 
      },
      { 
        id: "1-3", 
        name: "Herbs", 
        description: "Fresh herbs",
        categoryId: "1",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 2 
      }
    ]
  },
  {
    id: "2",
    name: "Meat & Poultry",
    description: "Fresh and frozen meats",
    color: "bg-red-500",
    isActive: true,
    branchName: "Main Branch",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    itemCount: 12,
    subcategories: [
      { 
        id: "2-1", 
        name: "Beef", 
        description: "Beef products",
        categoryId: "2",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 4 
      },
      { 
        id: "2-2", 
        name: "Chicken", 
        description: "Chicken products",
        categoryId: "2",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 5 
      },
      { 
        id: "2-3", 
        name: "Pork", 
        description: "Pork products",
        categoryId: "2",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 3 
      }
    ]
  },
  {
    id: "3",
    name: "Seafood",
    description: "Fresh and frozen seafood",
    color: "bg-blue-500",
    isActive: true,
    branchName: "Main Branch",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    itemCount: 8,
    subcategories: [
      { 
        id: "3-1", 
        name: "Fish", 
        description: "Fresh and frozen fish",
        categoryId: "3",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 5 
      },
      { 
        id: "3-2", 
        name: "Shellfish", 
        description: "Shellfish products",
        categoryId: "3",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 3 
      }
    ]
  },
  {
    id: "4",
    name: "Dairy & Eggs",
    description: "Dairy products and eggs",
    color: "bg-yellow-500",
    isActive: true,
    branchName: "Main Branch",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    itemCount: 10,
    subcategories: [
      { 
        id: "4-1", 
        name: "Cheese", 
        description: "Various cheese types",
        categoryId: "4",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 4 
      },
      { 
        id: "4-2", 
        name: "Milk & Cream", 
        description: "Dairy milk and cream",
        categoryId: "4",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 3 
      },
      { 
        id: "4-3", 
        name: "Eggs", 
        description: "Fresh eggs",
        categoryId: "4",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 3 
      }
    ]
  },
  {
    id: "5",
    name: "Dry Goods",
    description: "Non-perishable food items",
    color: "bg-orange-500",
    isActive: true,
    branchName: "Main Branch",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    itemCount: 20,
    subcategories: [
      { 
        id: "5-1", 
        name: "Grains & Rice", 
        description: "Grains and rice products",
        categoryId: "5",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 6 
      },
      { 
        id: "5-2", 
        name: "Pasta", 
        description: "Pasta and noodles",
        categoryId: "5",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 4 
      },
      { 
        id: "5-3", 
        name: "Canned Goods", 
        description: "Canned food items",
        categoryId: "5",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 10 
      }
    ]
  },
  {
    id: "6",
    name: "Beverages",
    description: "Drinks and beverages",
    color: "bg-purple-500",
    isActive: true,
    branchName: "Main Branch",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    itemCount: 15,
    subcategories: [
      { 
        id: "6-1", 
        name: "Soft Drinks", 
        description: "Carbonated beverages",
        categoryId: "6",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 8 
      },
      { 
        id: "6-2", 
        name: "Juices", 
        description: "Fruit and vegetable juices",
        categoryId: "6",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 4 
      },
      { 
        id: "6-3", 
        name: "Alcoholic Beverages", 
        description: "Alcoholic drinks",
        categoryId: "6",
        isActive: true,
        branchName: "Main Branch",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        itemCount: 3 
      }
    ]
  }
]

export const units = [
  "kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"
] as const

export const locations = [
  "Walk-in Fridge", "Freezer", "Dry Storage", "Pantry", "Wine Cellar", "Prep Station"
] as const

export type Unit = typeof units[number]
export type Location = typeof locations[number]

export interface Supplier {
  id: string
  code: string
  name: string
  legalName?: string
  description?: string
  taxNumber?: string
  registrationNumber?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country: string
  postalCode?: string
  businessType?: string
  industry?: string
  establishedYear?: number
  employeeCount?: number
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLACKLISTED"
  rating?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "VERY_POOR"
  creditLimit?: number
  paymentTerms: "NET_15" | "NET_30" | "NET_45" | "NET_60" | "DUE_ON_RECEIPT" | "ADVANCE"
  bankName?: string
  bankAccount?: string
  bankRouting?: string
  currency: string
  contacts: SupplierContact[]
  products: SupplierProduct[]
  purchaseOrders: any[]
  evaluations: SupplierEvaluation[]
  createdById: string
  createdAt: string
  updatedAt: string
  notes?: string
  purchaseOrderCount: number
  productCount: number
}

export interface SupplierContact {
  id: string
  supplierId: string
  name: string
  position?: string
  email?: string
  phone?: string
  mobile?: string
  isPrimary: boolean
  department?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SupplierProduct {
  id: string
  supplierId: string
  inventoryItemId: string
  supplierCode?: string
  supplierName?: string
  unitPrice: number
  minOrderQuantity?: number
  packSize?: string
  leadTime?: number
  isActive: boolean
  previousPrice?: number
  priceLastUpdated?: string
  notes?: string
  createdAt: string
  updatedAt: string
  supplier?: Supplier
  inventoryItem?: InventoryItem
}

export interface SupplierEvaluation {
  id: string
  supplierId: string
  evaluationDate: string
  evaluatedById: string
  qualityRating: number
  deliveryRating: number
  priceRating: number
  serviceRating: number
  communicationRating: number
  overallRating: number
  comments?: string
  recommendations?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Request DTOs for forms
export interface SupplierFormData {
  code?: string
  name: string
  legalName?: string
  description?: string
  taxNumber?: string
  registrationNumber?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  businessType?: string
  industry?: string
  establishedYear?: number
  employeeCount?: number
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BLACKLISTED"
  rating?: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR" | "VERY_POOR"
  creditLimit?: number
  paymentTerms?: "NET_15" | "NET_30" | "NET_45" | "NET_60" | "DUE_ON_RECEIPT" | "ADVANCE"
  bankName?: string
  bankAccount?: string
  bankRouting?: string
  currency?: string
  notes?: string
}

export interface SupplierContactFormData {
  name: string
  position?: string
  email?: string
  phone?: string
  mobile?: string
  isPrimary?: boolean
  department?: string
  notes?: string
}

export interface SupplierProductFormData {
  supplierCode?: string
  supplierName?: string
  unitPrice: number
  minOrderQuantity?: number
  packSize?: string
  leadTime?: number
  isActive?: boolean
  notes?: string
}

export interface SupplierEvaluationFormData {
  qualityRating: number
  deliveryRating: number
  priceRating: number
  serviceRating: number
  communicationRating: number
  comments?: string
  recommendations?: string
}