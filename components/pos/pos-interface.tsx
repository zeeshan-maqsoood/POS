'use client';

import { useState } from 'react';
import { MenuItem, MenuCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function POSInterface() {
  const [cart, setCart] = useState<{item: MenuItem; quantity: number}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const categories: MenuCategory[] = [
    { id: '1', name: 'Appetizers', description: 'Starters and small bites' },
    { id: '2', name: 'Main Course', description: 'Hearty main dishes' },
    { id: '3', name: 'Desserts', description: 'Sweet treats' },
    { id: '4', name: 'Beverages', description: 'Drinks and refreshments' },
  ];

  const allMenuItems: MenuItem[] = [
    { 
      id: '1', 
      name: 'Bruschetta', 
      price: 8.99, 
      categoryId: '1', 
      description: 'Toasted bread with tomatoes and garlic',
      isAvailable: true
    },
    { 
      id: '2', 
      name: 'Caesar Salad', 
      price: 10.99, 
      categoryId: '1', 
      description: 'Classic Caesar with croutons',
      isAvailable: true
    },
    { 
      id: '3', 
      name: 'Grilled Salmon', 
      price: 22.99, 
      categoryId: '2', 
      description: 'Fresh salmon with lemon butter',
      isAvailable: true
    },
    { 
      id: '4', 
      name: 'Chicken Alfredo', 
      price: 16.99, 
      categoryId: '2', 
      description: 'Creamy pasta with grilled chicken',
      isAvailable: true
    },
    { 
      id: '5', 
      name: 'Tiramisu', 
      price: 7.99, 
      categoryId: '3', 
      description: 'Classic Italian dessert',
      isAvailable: true
    },
    { 
      id: '6', 
      name: 'Iced Tea', 
      price: 3.49, 
      categoryId: '4', 
      description: 'Refreshing iced tea',
      isAvailable: true
    },
  ];

  // Filter menu items by selected category and search query
  const filteredItems = allMenuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Cart operations
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
    setCart(prevCart => prevCart.filter(item => item.item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate order summary
  const subtotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  const processPayment = () => {
    // Just show an alert for now
    alert('Payment would be processed here!');
    setCart([]);
  };


  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-64 bg-white border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Categories</h2>
          <div className="space-y-2">
            <Button 
              variant={!selectedCategory ? 'secondary' : 'ghost'}
              className="w-full justify-start font-medium"
              onClick={() => setSelectedCategory(null)}
            >
              All Items
            </Button>
            {categories.map((category) => (
              <Button 
                key={category.id}
                variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found</p>
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => {
                const category = categories.find(cat => cat.id === item.categoryId);
                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="h-32 bg-gray-100 rounded-t-lg">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {category && (
                          <Badge variant="outline" className="text-xs">
                            {category.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                    </CardHeader>
                    <div className="mt-auto p-4 pt-0">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">{formatCurrency(item.price)}</span>
                        <Button 
                          size="sm" 
                          onClick={() => addToCart(item)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <div className="w-96 bg-white border-l p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order
              {cart.length > 0 && (
                <Badge className="ml-2">{cart.reduce((sum, item) => sum + item.quantity, 0)}</Badge>
              )}
            </h2>
            {cart.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-500"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>Your cart is empty</p>
                <p className="text-sm">Add items to get started</p>
              </div>
            ) : (
              cart.map((cartItem) => (
                <div key={cartItem.item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{cartItem.item.name}</p>
                    <p className="text-sm text-gray-500">{formatCurrency(cartItem.item.price)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center">{cartItem.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (10%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
              disabled={cart.length === 0}
              onClick={processPayment}
            >
              Process Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
