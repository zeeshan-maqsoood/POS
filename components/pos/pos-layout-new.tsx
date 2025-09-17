'use client';

import { useState, useEffect, useMemo } from 'react';
import { MenuItem } from '@/types/menu';
import { MenuCategories } from "./menu-categories";
import { MenuItems } from "./menu-items";
import { OrderSummary } from "./order-summary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
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
  const [tableNumber, setTableNumber] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [categoriesResponse, itemsResponse] = await Promise.all([
          categoryApi.getCategories(),
          menuItemApi.getItems()
        ]);

        // Handle API responses safely
        const categoriesData = Array.isArray(categoriesResponse?.data) 
          ? categoriesResponse.data 
          : [];
          
        const itemsData = Array.isArray(itemsResponse?.data)
          ? itemsResponse.data
          : [];

        setCategories(categoriesData);
        setMenuItems(itemsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load menu data');
        toast.error('Failed to load menu. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems.filter(item => {
      if (!item) return false;
      
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         false;
      const matchesCategory = selectedCategory === 'All' || 
                            item.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.item.id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const handlePlaceOrder = async () => {
    try {
      // TODO: Implement order placement logic
      console.log('Placing order:', { tableNumber, items: cart });
      toast.success('Order placed successfully!');
      clearCart();
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading menu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-64 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Menu Section */}
        <div className="w-2/3 p-4 overflow-y-auto">
          <MenuCategories 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-3">
              {selectedCategory === 'All' ? 'All Items' : 
               categories.find(c => c.id === selectedCategory)?.name || 'Category'}
            </h2>
            <MenuItems 
              menuItems={filteredItems} 
              onAddToCart={addToCart} 
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-1/3 border-l bg-gray-50 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          
          <div className="flex items-center mb-4">
            <Input
              type="text"
              placeholder="Table #"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-32 mr-2"
            />
            {cart.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearCart}
                className="ml-auto"
              >
                Clear
              </Button>
            )}
          </div>

          <OrderSummary 
            cart={cart}
            onUpdateCart={(updatedCart) => setCart(updatedCart)}
            onClearCart={clearCart}
            subtotal={cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)}
            tax={cart.reduce((sum, item) => sum + (item.item.price * item.quantity * 0.1), 0)} // 10% tax
            total={cart.reduce((sum, item) => sum + (item.item.price * item.quantity * 1.1), 0)} // total with tax
            selectedBranch={''}
            tableNumber={tableNumber}
            customerName={''}
            onBranchChange={() => {}}
            onTableNumberChange={setTableNumber}
            onCustomerNameChange={() => {}}
            onOrderPlaced={handlePlaceOrder}
          />

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Total Items:</span>
              <span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold mb-4">
              <span>Total:</span>
              <span>
                ${cart
                  .reduce((sum, item) => sum + (item.item.price * item.quantity), 0)
                  .toFixed(2)}
              </span>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || !tableNumber}
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
