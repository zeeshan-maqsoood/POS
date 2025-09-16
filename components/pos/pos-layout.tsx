// 'use client';

// import { useState, useEffect, useMemo } from 'react';
// import Link from 'next/link';
// import { MenuItem } from '@/types/menu';
// import { MenuCategories } from "./menu-categories";
// import { MenuItems } from "./menu-items";
// import { OrderSummary } from "./order-summary";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Search, X, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
// import { cn } from "@/lib/utils";
// import { menuItemApi, categoryApi } from '@/lib/menu-api';
// import { toast } from 'sonner';

// // Define API response interfaces
// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
//   statusCode: number;
// }

// // Define Category interface
// interface Category {
//   id: string;
//   name: string;
//   description?: string;
//   isActive: boolean;
//   imageUrl?: string;
//   displayOrder: number;
//   createdAt: string;
//   updatedAt: string;
//   menuItems?: MenuItem[];
// }

// // Initialize with empty arrays - will be populated from API
// const initialMenuItems: MenuItem[] = [];
// const initialCategories: Category[] = [];

// interface CartItem {
//   item: MenuItem;
//   quantity: number;
// }

// interface ApiResponse<T = any> {
//   data: T;
// }

// export function POSLayout() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [cart, setCart] = useState<{item: MenuItem; quantity: number}[]>([]);
//   const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
//   const [categories, setCategories] = useState<Category[]>(initialCategories);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedBranch, setSelectedBranch] = useState('');
//   const [tableNumber, setTableNumber] = useState('');
//   const [customerName, setCustomerName] = useState('');
//   const [isSearchFocused, setIsSearchFocused] = useState(false);

//   // Fetch data on component mount
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
        
//         // Fetch categories and menu items in parallel
//         const [categoriesResponse, itemsResponse] = await Promise.allSettled([
//           categoryApi.getCategories(),
//           menuItemApi.getItems()
//         ]);

//         // Log raw responses for debugging
//         console.log('Categories Response:', categoriesResponse);
//         console.log('Items Response:', itemsResponse);

//         // Handle API errors
//         if (categoriesResponse.status === 'rejected') {
//           console.error('Failed to fetch categories:', categoriesResponse.reason);
//           throw new Error('Failed to load categories');
//         }
        
//         if (itemsResponse.status === 'rejected') {
//           console.error('Failed to fetch menu items:', itemsResponse.reason);
//           throw new Error('Failed to load menu items');
//         }

//         // Safely extract data from responses
//         const categoriesResponseData = categoriesResponse.status === 'fulfilled' 
//           ? (categoriesResponse.value?.data as any)?.data
//           : null;
          
//         const itemsResponseData = itemsResponse.status === 'fulfilled'
//           ? (itemsResponse.value?.data as any)?.data
//           : null;

//         // Process categories data
//         const categoriesData: Category[] = [];
//         if (Array.isArray(categoriesResponseData)) {
//           categoriesData.push(...categoriesResponseData);
//         } else if (categoriesResponseData && typeof categoriesResponseData === 'object') {
//           // Handle case where we got a single category
//           categoriesData.push(categoriesResponseData);
//         }
        
//         // Process items data
//         const itemsData: MenuItem[] = [];
//         if (Array.isArray(itemsResponseData)) {
//           itemsData.push(...itemsResponseData);
//         } else if (itemsResponseData && typeof itemsResponseData === 'object') {
//           // Handle case where we got a single item
//           itemsData.push(itemsResponseData);
//         }

//         console.log('Processed Categories:', categoriesData);
//         console.log('Processed Items:', itemsData);

//         if (categoriesData.length === 0 || itemsData.length === 0) {
//           throw new Error('No data received from the server');
//         }

//         setCategories(categoriesData);
        
//         // Transform menu items to include category name
//         const itemsWithCategory = itemsData.map((item: any) => {
//           const category = categoriesData.find((cat: Category) => cat.id === item.categoryId);
//           return {
//             ...item,
//             category: category?.name || 'Uncategorized',
//             // Ensure required fields have default values
//             price: item.price || 0,
//             taxRate: item.taxRate || 0,
//             isActive: item.isActive !== undefined ? item.isActive : true,
//             taxExempt: item.taxExempt || false
//           };
//         });
        
//         setMenuItems(itemsWithCategory);
//       } catch (err) {
//         console.error('Error fetching menu data:', err);
//         setError('Failed to load menu data. Please try again later.');
//         toast.error('Failed to load menu data');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const filteredItems = useMemo(() => {
//     if (isLoading || error) return [];
    
//     let result = [...menuItems];
    
//     // Filter by search query
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       result = result.filter(item => 
//         item.name.toLowerCase().includes(query) || 
//         (item.description?.toLowerCase().includes(query) || '') ||
//         item.category?.toLowerCase().includes(query)
//       );
//     }
    
//     // Filter by category
//     if (selectedCategory !== 'All') {
//       result = result.filter(item => item.category === selectedCategory);
//     }
    
//     return result;
//   }, [menuItems, searchQuery, selectedCategory, isLoading, error]);

//   const addToCart = (item: MenuItem) => {
//     setCart(prevCart => {
//       const existingItem = prevCart.find(cartItem => cartItem.item.id === item.id);
//       if (existingItem) {
//         return prevCart.map(cartItem =>
//           cartItem.item.id === item.id
//             ? { ...cartItem, quantity: cartItem.quantity + 1 }
//             : cartItem
//         );
//       }
//       return [...prevCart, { item, quantity: 1 }];
//     });
//   };

//   const removeFromCart = (itemId: string) => {
//     setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
//   };

//   const clearCart = () => {
//     setCart([]);
//   };

//   const handleOrderPlaced = () => {
//     // Refresh data or perform any other actions after order is placed
//     toast.success('Order placed successfully!');
//   };

//   const clearSearch = () => {
//     setSearchQuery('');
//   };

//   const subtotal = cart.reduce(
//     (sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity),
//     0
//   );
//   const tax = subtotal * 0.1; // 10% tax
//   const total = subtotal + tax;

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="flex flex-col items-center">
//           <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
//           <p className="text-gray-600">Loading menu...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow">
//           <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Menu</h2>
//           <p className="text-gray-600 mb-4">{error}</p>
//           <Button 
//             onClick={() => window.location.reload()}
//             className="mt-2"
//           >
//             Retry
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col h-screen bg-gray-50">
//       {/* Header */}
//       <header className="bg-white shadow-sm p-2 sm:p-4 sticky top-0 z-20">
//         <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
//           <div className="flex items-center justify-between w-full sm:w-auto">
//             <div className="flex items-center space-x-2 sm:space-x-4">
//               <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
//                 <Link href="/dashboard" className="flex items-center">
//                   <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
//                 </Link>
//               </Button>
//               <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Point of Sale</h1>
//             </div>
//             <div className="sm:hidden">
//               <Button 
//                 variant="outline" 
//                 size="sm" 
//                 className="relative"
//                 onClick={() => {
//                   const panel = document.getElementById('order-summary-panel');
//                   panel?.classList.toggle('translate-y-0');
//                   panel?.classList.toggle('translate-y-full');
//                 }}
//               >
//                 <ShoppingCart className="h-4 w-4 mr-1" />
//                 {cart.length > 0 && (
//                   <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                     {cart.reduce((total, item) => total + item.quantity, 0)}
//                   </span>
//                 )}
//               </Button>
//             </div>
//           </div>
//           <div className="relative w-full sm:w-1/3 mt-2 sm:mt-0">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
//               <Input
//                 type="search"
//                 placeholder="Search menu..."
//                 className="w-full pl-10"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 onFocus={() => setIsSearchFocused(true)}
//                 onBlur={() => setIsSearchFocused(false)}
//               />
//               {searchQuery && (
//                 <button
//                   onClick={() => setSearchQuery('')}
//                   className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                 >
//                   <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
//                 </button>
//               )}
//             </div>
//           </div>
//         </div>
//       </header>

//       <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
//         {/* Menu Section */}
//         <div className="w-full md:w-3/5 p-2 sm:p-4 md:p-6 overflow-y-auto">
//           <div className="mb-4 sm:mb-6">
//             <div className="overflow-x-auto pb-2">
//               <MenuCategories 
//                 categories={['All', ...categories.map(cat => cat.name)]} 
//                 selectedCategory={selectedCategory} 
//                 onSelectCategory={setSelectedCategory} 
//               />
//             </div>
//           </div>
          
//           <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
//             <MenuItems 
//               menuItems={filteredItems} 
//               onAddToCart={addToCart}
//             />
//           </div>
          
//           {filteredItems.length === 0 && (
//             <div className="text-center py-12 text-gray-500">
//               <p>No items found. Try a different search or category.</p>
//             </div>
//           )}
//         </div>

//         {/* Order Summary - Fixed at bottom on mobile, side panel on desktop */}
//         {/* Order Summary - Fixed at bottom on mobile, side panel on desktop */}
//         <div 
//           className="fixed bottom-0 left-0 right-0 z-10 md:static md:w-2/5 bg-white border-t md:border-l border-gray-200 shadow-lg md:shadow-none flex flex-col transition-transform duration-300 ease-in-out transform translate-y-full md:translate-y-0"
//           style={{ maxHeight: '80vh' }}
//           id="order-summary-panel"
//         >
//           {/* Mobile header with close button */}
//           <div className="flex items-center justify-between p-2 border-b md:hidden bg-white sticky top-0 z-10">
//             <h2 className="text-base font-semibold">Order Summary</h2>
//             <button 
//               onClick={() => {
//                 const panel = document.getElementById('order-summary-panel');
//                 panel?.classList.add('translate-y-full');
//               }}
//               className="p-1 rounded-full hover:bg-gray-100"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
          
//           {/* Order Summary Content */}
//           <div className="flex-1 overflow-y-auto">
//             <OrderSummary
//               cart={cart}
//               onUpdateCart={setCart}
//               onClearCart={clearCart}
//               subtotal={subtotal}
//               tax={tax}
//               total={total}
//               onBranchChange={setSelectedBranch}
//               onTableNumberChange={setTableNumber}
//               onCustomerNameChange={setCustomerName}
//               selectedBranch={selectedBranch}
//               tableNumber={tableNumber}
//               customerName={customerName}
//               onOrderPlaced={handleOrderPlaced}
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MenuItem } from '@/types/menu';
import { MenuCategories } from "./menu-categories";
import { MenuItems } from "./menu-items";
import { OrderSummary } from "./order-summary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { menuItemApi, categoryApi } from '@/lib/menu-api';
import { toast } from 'sonner';

// Define API response interfaces
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

// Define Category interface
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

// Initialize with empty arrays - will be populated from API
const initialMenuItems: MenuItem[] = [];
const initialCategories: Category[] = [];

interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface ApiResponse<T = any> {
  data: T;
}

export function POSLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<{item: MenuItem; quantity: number}[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch categories and menu items in parallel
        const [categoriesResponse, itemsResponse] = await Promise.allSettled([
          categoryApi.getCategories(),
          menuItemApi.getItems()
        ]);

        // Log raw responses for debugging
        console.log('Categories Response:', categoriesResponse);
        console.log('Items Response:', itemsResponse);

        // Handle API errors
        if (categoriesResponse.status === 'rejected') {
          console.error('Failed to fetch categories:', categoriesResponse.reason);
          throw new Error('Failed to load categories');
        }
        
        if (itemsResponse.status === 'rejected') {
          console.error('Failed to fetch menu items:', itemsResponse.reason);
          throw new Error('Failed to load menu items');
        }

        // Safely extract data from responses
        const categoriesResponseData = categoriesResponse.status === 'fulfilled' 
          ? (categoriesResponse.value?.data as any)?.data
          : null;
          
        const itemsResponseData = itemsResponse.status === 'fulfilled'
          ? (itemsResponse.value?.data as any)?.data
          : null;

        // Process categories data
        const categoriesData: Category[] = [];
        if (Array.isArray(categoriesResponseData)) {
          categoriesData.push(...categoriesResponseData);
        } else if (categoriesResponseData && typeof categoriesResponseData === 'object') {
          // Handle case where we got a single category
          categoriesData.push(categoriesResponseData);
        }
        
        // Process items data
        const itemsData: MenuItem[] = [];
        if (Array.isArray(itemsResponseData)) {
          itemsData.push(...itemsResponseData);
        } else if (itemsResponseData && typeof itemsResponseData === 'object') {
          // Handle case where we got a single item
          itemsData.push(itemsResponseData);
        }

        console.log('Processed Categories:', categoriesData);
        console.log('Processed Items:', itemsData);

        if (categoriesData.length === 0 || itemsData.length === 0) {
          throw new Error('No data received from the server');
        }

        setCategories(categoriesData);
        
        // Transform menu items to include category name
        const itemsWithCategory = itemsData.map((item: any) => {
          const category = categoriesData.find((cat: Category) => cat.id === item.categoryId);
          return {
            ...item,
            category: category?.name || 'Uncategorized',
            // Ensure required fields have default values
            price: item.price || 0,
            taxRate: item.taxRate || 0,
            isActive: item.isActive !== undefined ? item.isActive : true,
            taxExempt: item.taxExempt || false
          };
        });
        
        setMenuItems(itemsWithCategory);
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu data. Please try again later.');
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
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.description?.toLowerCase().includes(query) || '') ||
        item.category?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    return result;
  }, [menuItems, searchQuery, selectedCategory, isLoading, error]);

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

  const clearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = () => {
    // Refresh data or perform any other actions after order is placed
    toast.success('Order placed successfully!');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const subtotal = cart.reduce(
    (sum, cartItem) => sum + (cartItem.item.price * cartItem.quantity),
    0
  );
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Menu</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-2 sm:p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <Link href="/dashboard" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Point of Sale</h1>
            </div>
            <div className="sm:hidden">
              <Button 
                variant="outline" 
                size="sm" 
                className="relative"
                onClick={() => {
                  const panel = document.getElementById('order-summary-panel');
                  panel?.classList.toggle('translate-y-0');
                  panel?.classList.toggle('translate-y-full');
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>
          <div className="relative w-full sm:w-1/3 mt-2 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="search"
                placeholder="Search menu..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Menu Section */}
        <div className="w-full md:w-3/5 p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <div className="overflow-x-auto pb-2">
              <MenuCategories 
                categories={['All', ...categories.map(cat => cat.name)]} 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory} 
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <MenuItems 
              menuItems={filteredItems} 
              onAddToCart={addToCart}
            />
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No items found. Try a different search or category.</p>
            </div>
          )}
        </div>

        {/* Order Summary - Fixed at bottom on mobile, side panel on desktop */}
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 md:static md:z-10 md:w-2/5 bg-white border-t md:border-l border-gray-200 shadow-lg md:shadow-none flex flex-col transition-transform duration-300 ease-in-out transform translate-y-full md:translate-y-0"
          style={{
            height: '80vh',
            maxHeight: 'calc(100vh - 4rem)', // Account for search header
            top: 'auto',
            bottom: 0,
            zIndex: 50
          }}
          id="order-summary-panel"
        >
          {/* Mobile header with close button */}
          <div className="flex items-center justify-between p-3 border-b md:hidden bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <button 
              onClick={() => {
                const panel = document.getElementById('order-summary-panel');
                panel?.classList.add('translate-y-full');
              }}
              className="p-1.5 rounded-full hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Order Summary Content */}
          <div className="flex-1 overflow-y-auto">
            <OrderSummary
              cart={cart}
              onUpdateCart={setCart}
              onClearCart={clearCart}
              subtotal={subtotal}
              tax={tax}
              total={total}
              onBranchChange={setSelectedBranch}
              onTableNumberChange={setTableNumber}
              onCustomerNameChange={setCustomerName}
              selectedBranch={selectedBranch}
              tableNumber={tableNumber}
              customerName={customerName}
              onOrderPlaced={handleOrderPlaced}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
