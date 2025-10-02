export interface MenuItem {
  modifiers: any[];
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  cost?: number;
  taxRate?: number;
  taxExempt?: boolean;
  category: string;
  categoryId?: string;
  isActive?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  item: MenuItem;
  quantity: number;
}
