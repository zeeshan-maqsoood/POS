export interface MenuCategory {
  id: string;
  name: string;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isDairyFree?: boolean;
  isSpicy?: boolean;
  calories?: number;
  preparationTime?: number; // in minutes
  ingredients?: string[];
  // For inventory/tracking
  sku?: string;
  barcode?: string;
  costPrice?: number; // For profit calculation
  taxRate?: number; // Tax rate specific to this item
  // For modifiers/groups
  modifierGroupIds?: string[]; // For items that can have modifiers
  // For display
  displayOrder?: number; // For custom sorting in the menu
  isFeatured?: boolean; // For featured/highlighted items
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  notes?: string;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'cancelled' | 'completed';
  customerName?: string;
  customerEmail?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
