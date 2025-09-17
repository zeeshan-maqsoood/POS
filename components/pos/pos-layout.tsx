'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MenuItem } from '@/types/menu';
import { MenuCategories } from "./menu-categories";
import { MenuItems } from "./menu-items";
import { OrderSummary } from "./order-summary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ShoppingCart, Loader2, ArrowLeft } from 'lucide-react';
import { menuItemApi, categoryApi } from '@/lib/menu-api';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  imageUrl?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  menuItems?: MenuItem[];
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

export function POSLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [categoriesResponse, itemsResponse] = await Promise.allSettled([
          categoryApi.getCategories(),
          menuItemApi.getItems()
        ]);

        const categoriesData =
          categoriesResponse.status === 'fulfilled'
            ? (categoriesResponse.value?.data as any)?.data ?? []
            : [];
        const itemsData =
          itemsResponse.status === 'fulfilled'
            ? (itemsResponse.value?.data as any)?.data ?? []
            : [];

        setCategories(Array.isArray(categoriesData) ? categoriesData : [categoriesData]);
        const itemsWithCategory = (Array.isArray(itemsData) ? itemsData : [itemsData]).map((item: any) => {
          const category = categoriesData.find((cat: Category) => cat.id === item.categoryId);
          return {
            ...item,
            category: category?.name || 'Uncategorized',
            price: item.price || 0,
            taxRate: item.taxRate || 0,
            isActive: item.isActive ?? true,
            taxExempt: item.taxExempt || false,
          };
        });
        setMenuItems(itemsWithCategory);

        if (!itemsData || itemsData.length === 0) {
          toast.warning('No menu items found. Please add items to the menu.');
        }
      } catch (err) {
        setError('Failed to load menu data');
        toast.error('Failed to load menu data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    if (isLoading || error) return [];
    let result = [...menuItems];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query)
      );
    }
    if (selectedCategory !== 'All') {
      result = result.filter((item) => item.category === selectedCategory);
    }
    return result;
  }, [menuItems, searchQuery, selectedCategory, isLoading, error]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.item.id === item.id);
      return existing
        ? prev.map((ci) =>
            ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
          )
        : [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) =>
    setCart((prev) => prev.filter((ci) => ci.item.id !== itemId));

  const clearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = () => {
    // Clear the cart when order is placed
    clearCart();
    // You can add additional logic here like showing a success message
    // or redirecting to another page
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-2 sm:p-4 sticky top-0 z-20">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Point of Sale</h1>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search menu..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Menu */}
        <div className="w-full md:w-3/5 p-4 overflow-y-auto">
          <MenuCategories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <MenuItems menuItems={filteredItems} onAddToCart={addToCart} />
        </div>

        {/* Order Summary */}
        <div className="w-full md:w-2/5 border-l">
          <OrderSummary
            cart={cart}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onOrderPlaced={handleOrderPlaced}
          />
        </div>
      </div>
    </div>
  );
}