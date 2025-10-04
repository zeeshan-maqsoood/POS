'use client';

import { useState, useEffect, useMemo, useCallback, memo,useRef } from 'react';
import Link from 'next/link';
import type { MenuItem } from '@/types/menu';
import { MenuCategories } from "./menu-categories";
import { MenuItems } from "./menu-items";
import { OrderSummary as BaseOrderSummary } from "./order-summary";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { menuItemApi, categoryApi } from '@/lib/menu-api';
import { orderApi } from '@/lib/order-api';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { usePermissions } from '@/hooks/use-permissions';
import { CartItem } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
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

interface POSLayoutProps {
  editOrderData?: any; // You might want to create a proper type for this
}

export function POSLayout({ editOrderData }: POSLayoutProps) {
  const searchParams = useSearchParams();
  const editOrderId = searchParams.get('editOrderId');
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const hasProcessedEditOrder=useRef(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Initialize cart with items from editOrderData if available
    if (editOrderData?.items) {
      return editOrderData.items.map((item: any) => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        name: item.name,
        price:Number(item.price)+Number(item.taxRate)/100,
        quantity: item.quantity,
        menuItemId: item.menuItemId,
        taxRate: item.taxRate || 0,
        tax: item.tax || 0,
        total: item.total || 0,
        notes: item.notes || '',
        modifiers: item.modifiers || []
      }));
    }
    return [];
  });
  useEffect(() => {
    const fetchOrderData = async () => {
      if (!editOrderId) return;

      setIsLoadingOrder(true);
      try {
        const response = await orderApi.getOrder(editOrderId);
        const orderData = response.data;

        // Update cart with order items
        if (orderData.items) {
          const updatedCart = orderData.items.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.menuItem?.name || item.name || 'Unknown Item',
            price: Number(item.price)+Number(item.taxRate)/100,
            quantity: item.quantity,
            menuItemId: item.menuItemId || item.id,
            taxRate: item.taxRate || 0,
            tax: item.tax || 0,
            subtotal: item.subtotal || 0,
            total: item.total || 0,
            notes: item.notes || '',
            modifiers: item.modifiers || []
          }));
         console.log(updatedCart,"updatedCart")
          setCart(updatedCart);
        }

        // Update form fields
        setOrderType(orderData.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DINE_IN');
        setSelectedBranch(orderData.branchId || null);
        setTableNumber(orderData.tableNumber || '');
        setCustomerName(orderData.customerName || '');

      } catch (error) {
        console.error('Error fetching order data:', error);
        toast.error('Failed to load order data');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchOrderData();
  }, [editOrderId]);
  // Initialize form state with editOrderData or defaults
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>(() => {
    return editOrderData?.orderType === 'TAKEAWAY' || editOrderData?.orderType === 'TAKEOUT'
      ? 'TAKEAWAY'
      : 'DINE_IN';
  });
  console.log(editOrderData,"editOrderData")

  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [occupiedTables, setOccupiedTables] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(editOrderData?.branchId || null);
  const [tableNumber, setTableNumber] = useState<string>(editOrderData?.tableNumber || '');
  const [customerName, setCustomerName] = useState<string>(editOrderData?.customerName || '');
  // Initialize cart from editOrderData if it exists
  const [hasInitializedCart, setHasInitializedCart] = useState(false);

  useEffect(() => {
    if (editOrderData?.items && !hasInitializedCart) {
      const initialCart = editOrderData.items.map(item => ({
        item: {
          id: item.menuItemId,
          name: item.menuItem?.name || 'Unknown Item',
          price: item.price,
          // Add other required item properties
        },
        quantity: item.quantity,
        notes: item.notes || '',
        modifiers: item.modifiers || [],
        // Add other required cart item properties
      }));
      setCart(initialCart);
      setHasInitializedCart(true);
    }
  }, [editOrderData, hasInitializedCart]);

  // Reset initialization flag when editOrderData changes
  useEffect(() => {
    setHasInitializedCart(false);
  }, [editOrderData?.id]);
  // Add this useEffect right after your existing useEffects in POSLayout

console.log(menuItems,"menuItems")

  // Handler functions
  const handleClearCart = useCallback(() => {
    setCart([]);
    setTableNumber('');
    setCustomerName('');
    setOrderType('DINE_IN');
  }, []);

  const handleBranchChange = useCallback((branchId: string) => {
    setSelectedBranch(branchId);
  }, []);

  const handleTableNumberChange = useCallback((tableNum: string) => {
    setTableNumber(tableNum);
  }, []);

  const handleCustomerNameChange = useCallback((name: string) => {
    setCustomerName(name);
  }, []);

  const handleOrderTypeChange = useCallback((type: 'DINE_IN' | 'TAKEAWAY') => {
    setOrderType(type);
  }, []);

  // Get user information for branch filtering
  const { user, isAdmin } = useUser();

  // Set initial branch when user data is loaded
  // Set initial branch when user data is loaded
  useEffect(() => {
    if (user) {
      // If user is not admin and has a branch, use that
      if (!isAdmin && user.branch) {
        setSelectedBranch(user.branch);
      }
      // If admin, you might want to set a default branch or leave it to be selected
      // For now, we'll leave it as null for admins
    }
  }, [user, isAdmin]);

  // Fetch occupied tables for the selected branch
  const fetchOccupiedTables = async (branch: string | null) => {
    if (!branch) {
      console.log('No branch selected, clearing occupied tables');
      setOccupiedTables(new Set<string>());
      return;
    }

    try {
      console.log('Fetching occupied tables for branch:', branch);
      const response = await orderApi.getOrdersByBranch(branch);
      console.log('Occupied tables response:', response);

      const tables = new Set<string>();

      // The response is an object with data property containing the array of orders
      if (response && Array.isArray(response.data)) {
        response.data.forEach((item: { tableNumber: string }) => {
          if (item.tableNumber) {
            tables.add(item.tableNumber);
          }
        });
      }
      setOccupiedTables(tables);
    } catch (error: any) {
      console.error('Error fetching occupied tables:', error);
      // If there's an error, clear the tables
      setOccupiedTables(new Set<string>());

      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error status:', error.response.status);
      }
    }
  };

  // Fetch occupied tables when branch changes
  useEffect(() => {
    fetchOccupiedTables(selectedBranch);
  }, [selectedBranch]);

  // Set up WebSocket listener for order updates
  useEffect(() => {
    const handleOrderUpdate = (data: any) => {
      console.log('Received order update:', data);
      // If the order is completed or cancelled, refresh the occupied tables
      if (['COMPLETED', 'CANCELLED', 'PAID'].includes(data.status)) {
        fetchOccupiedTables(selectedBranch);
        // If the current table's order was completed, clear the selection
        if (data.tableNumber === tableNumber) {
          setTableNumber('');
        }
      }
    };

    // Check if WebSocket is available in the context
    if (window.Echo) {
      // Listen for order updates
      window.Echo.channel('orders')
        .listen('OrderStatusUpdated', handleOrderUpdate);
    }

    // Clean up listener when component unmounts
    return () => {
      if (window.Echo) {
        window.Echo.leaveChannel('orders');
      }
    };
  }, [selectedBranch, tableNumber]);
  const { hasPermission } = usePermissions();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const canCreateMenuItems = hasPermission('MENU_CREATE');

  // Set default selected branch to user's branch if not admin
  useEffect(() => {
    if (!isAdmin && user?.branch && !selectedBranch) {
      setSelectedBranch(user.branch);
    }
  }, [user, isAdmin, selectedBranch]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Prepare API parameters with branch filtering for managers
        const apiParams: any = {};
        if (!isAdmin && user?.branch) {
          // Normalize branch name for API call
          const normalizedBranch = user.branch.startsWith('branch')
            ? user.branch.replace('branch1', 'Bradford')
              .replace('branch2', 'Leeds')
              .replace('branch3', 'Helifax')
              .replace('branch4', 'Darley St Market')
            : user.branch;
          apiParams.branchName = normalizedBranch;
          console.log('POS filtering by branch:', user.branch, '->', normalizedBranch);
        }

        // Fetch categories and menu items in parallel
        const [categoriesResponse, itemsResponse] = await Promise.allSettled([
          categoryApi.getCategories(apiParams),
          menuItemApi.getItems(apiParams)
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

        // Set categories and items even if one of them is empty
        setCategories(categoriesData);

        // If no items found, set empty array and continue
        if (itemsData.length === 0) {
          setMenuItems([]);
          setIsLoading(false);
          return;
        }

        // Transform menu items to include category name
        const itemsWithCategory = itemsData.map((item: any) => {
          // Handle both cases: when category is included via join, or when we need to look it up
          let categoryName = 'Uncategorized';

          if (item.category) {
            // Category is included via Prisma join
            categoryName = item.category.name;
          } else if (item.categoryId && categoriesData.length > 0) {
            // Look up category by ID
            const category = categoriesData.find((cat: Category) => cat.id === item.categoryId);
            categoryName = category?.name || 'Uncategorized';
          }

          return {
            ...item,
            category: categoryName,
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
  }, [user, isAdmin]);
  console.log(menuItems,"menuItems")
  const editOrderDataId=editOrderData?.data?.items.map((item:any)=>item.menuItemId)
  console.log(editOrderDataId,"editOrderDataId")
  const menuItemsIds = menuItems.filter((item:any)=>item.id)
  console.log(menuItemsIds,"menuItemsIds")
  // const matchedMenuItems = menuItems.filter((item: any) => 
  //   editOrderDataId?.includes(item.id));
  // );
  // console.log('Matched Menu Items:', matchedMenuItems);
// Memoize the matched menu items to prevent unnecessary recalculations
 // Handle order data when editing
 
//  const updateCartFromOrder = useCallback(() => {
//   if (!editOrderData?.data?.items?.length || hasProcessedEditOrder.current) return;

//   const updatedCart = editOrderData.data.items.map((item: any) => {
//     const matchedItem = menuItems.find((menuItem: MenuItem) => menuItem.id === item.menuItemId);
    
//     return {
//       item: {
//         id: item.menuItemId || item.id,
//         name: item.name || matchedItem?.name || 'Unknown Item',
//         price: parseFloat((item.price || matchedItem?.price || 0).toString()),
//         description: item.description ?? matchedItem?.description ?? '',
//         categoryId: item.categoryId ?? matchedItem?.categoryId ?? '',
//         isActive: true,
//         imageUrl: item.imageUrl ?? matchedItem?.imageUrl ?? '',
//         modifiers: item.modifiers ?? []
//       },
//       quantity: item.quantity || 1
//     };
//   });

//   console.log('Updated cart:', updatedCart);
//   // Use functional update to ensure we have the latest state
//   setCart(prevCart => {
//     // Only update if the cart is empty or we have editOrderData
//     if (editOrderData?.data?.items?.length) {
//       return updatedCart;
//     }
//     return prevCart;
//   });
  
//   hasProcessedEditOrder.current = true;

//   // Update other form fields
//   if (editOrderData.data.orderType) {
//     setOrderType(editOrderData.data.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DINE_IN');
//   }
//   if (editOrderData.data.branchName) {
//     setSelectedBranch(editOrderData.data.branchName);
//   }
//   if (editOrderData.data.tableNumber) {
//     setTableNumber(editOrderData.data.tableNumber.toString());
//   }
//   if (editOrderData.data.customerName) {
//     setCustomerName(editOrderData.data.customerName);
//   }
// }, [editOrderData, menuItems]);

// Update cart when menu items and order data are available
// useEffect(() => {
//   if (menuItems.length > 0 && editOrderData?.data?.items?.length) {
//     updateCartFromOrder(); 
//   }
// }, [menuItems, editOrderData, updateCartFromOrder]);
// Reset the processed flag when the component unmounts or when editOrderId changes

// Filter items based on search and category
const filteredItems = useMemo(() => {
  if (isLoading || error) return [];

  let result = [...menuItems];
  
  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.description?.toLowerCase().includes(query)
    );
  }
  
  // Filter by category
  if (selectedCategory !== 'All') {
    result = result.filter(item => 
      item.categoryId === selectedCategory
    );
  }
  
  return result;
}, [menuItems, searchQuery, selectedCategory, isLoading, error]);

const addToCart = (menuItem: MenuItem, modifiers: Array<{ id: string; name: string; price: number }> = []) => {
  setCart(prevCart => {
    const itemKey = `${menuItem.id}-${modifiers.map(m => m.id).sort().join('-')}`;
    const existingItemIndex = prevCart.findIndex(cartItem =>
      `${cartItem.item.id}-${(cartItem.modifiers || []).map(m => m.id).sort().join('-')}` === itemKey
    );

    // Create a new menu item with tax-included price
    const menuItemWithTax = {
      ...menuItem,
      price: Number(menuItem.price) * (1 + (Number(menuItem.taxRate) / 100))
    };
    
    // Process modifiers to include tax
    const processedModifiers = (modifiers.length > 0 ? modifiers : (menuItem.modifiers || []).map(m => ({
      id: m.id || m.modifierId,
      name: m.name || `Modifier ${m.id || m.modifierId}`,
      price: Number(m.price || 0)
    }))).map(mod => {
      const modPrice = Number(mod.price) * (1 + (Number(menuItem.taxRate) / 100));
      return {
        ...mod,
        price: modPrice,
        originalPrice: Number(mod.price)
      };
    });

    // Calculate total price for the item including all modifiers
    const modifiersTotal = processedModifiers.reduce((sum, mod) => sum + mod.price, 0);
    const itemTotal = menuItemWithTax.price + modifiersTotal;

    if (existingItemIndex >= 0) {
      // Update existing item
      const updatedCart = [...prevCart];
      updatedCart[existingItemIndex] = {
        ...updatedCart[existingItemIndex],
        quantity: updatedCart[existingItemIndex].quantity + 1,
        totalPrice: updatedCart[existingItemIndex].totalPrice + itemTotal,
        item: menuItemWithTax, // Update with tax-included price
        modifiers: processedModifiers
      };
      return updatedCart;
    }

    // Add new item to cart
    return [
      ...prevCart,
      {
        item: menuItemWithTax, // Use the tax-included menu item
        quantity: 1,
        modifiers: processedModifiers,
        totalPrice: itemTotal,
        basePrice: menuItemWithTax.price
      }
    ];
  });
};
console.log(cart,"cart")
  const updateCartItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(index);
      return;
    }

    setCart(prevCart => {
      const newCart = [...prevCart];
      const item = newCart[index];

      if (item) {
        const pricePerItem = Number(item.basePrice)+Number(item.taxRate)/100 + (item.modifiers?.reduce((sum, mod) => sum + mod.price, 0) || 0);
        newCart[index] = {
          ...item,
          quantity: newQuantity,
          totalPrice: pricePerItem * newQuantity
        };
      }

      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  };

  // const removeFromCart = (itemId: string) => {
  //   setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== itemId));
  // };

  const clearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = async (orderId?: string) => {
    // If we're in edit mode, refresh the order data
    if (editOrderData?.data?.id) {
      try {
        const response = await orderApi.getOrder(editOrderData.data.id);
        console.log(response, "responsegetApi")
        if (response?.data) {
          editOrderData({
            ...editOrderData,
            data: response.data
          });
        }
      } catch (error) {
        console.error('Error refreshing order data:', error);
      }
    }

    // Clear the table selection if this was a dine-in order
    if (orderType === 'DINE_IN' && tableNumber) {
      setTableNumber('');
    }

    // Clear the cart and refresh tables
    setCart([]);
    await fetchOccupiedTables(selectedBranch);

    // Show success message
    toast.success(editOrderData?.data?.id ? 'Order updated successfully!' : 'Order placed successfully!');
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
    // Only show error if it's not a "no data" scenario
    if (error !== 'No menu items or categories found') {
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
    // For "no data" scenario, we'll continue to render the empty state below
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

          {menuItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Menu Items Found</h3>
                <p className="text-gray-600 mb-4">
                  {canCreateMenuItems
                    ? "There are currently no menu items available. You can add new items below."
                    : "There are currently no menu items available. Please contact an administrator to add items."
                  }
                </p>
                {canCreateMenuItems && (
                  <Button asChild>
                    <Link href="/dashboard/menu/items/new">
                      Add Menu Item
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No items found matching your search. Try a different search term or category.</p>
            </div>
          ) : null}
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
            <div className="h-full flex flex-col">
              <BaseOrderSummary
                key={editOrderData?.id || 'new-order'}
                cart={cart}
                onUpdateCart={setCart}
                onClearCart={handleClearCart}
                selectedBranch={selectedBranch || ''}
                tableNumber={tableNumber}
                customerName={customerName}
                onOrderPlaced={handleOrderPlaced}
                userBranch={user?.branch || ''}
                orderType={orderType}
                onOrderTypeChange={handleOrderTypeChange}
                onBranchChange={handleBranchChange}
                onTableNumberChange={handleTableNumberChange}
                onCustomerNameChange={handleCustomerNameChange}
                occupiedTables={occupiedTables}
                isEditMode={!!editOrderData}
                editOrderData={editOrderData}
                subtotal={subtotal}
                tax={tax}
                total={total}
                menuItems={menuItems}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
