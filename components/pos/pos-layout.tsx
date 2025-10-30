'use client';

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import Link from 'next/link';
import type { MenuItem } from '@/lib/types';
import { MenuCategories } from "./menu-categories";
import { MenuItems } from "./menu-items";
import { OrderSummary } from "./order-summary";
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
import { restaurantApi, Restaurant } from '@/lib/restaurant-api';
import { branchApi, Branch } from '@/lib/branch-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const hasProcessedEditOrder = useRef(false);

  // Move menuItems state to the top to ensure it's defined before useEffect
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (editOrderData?.items) {
      return editOrderData.items.map((item: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        item: {
          id: item.menuItemId || item.id,
          name: item.name || 'Unknown Item',
          price: Number(item.price) + Number(item.taxRate) / 100,
          description: item.description || '',
          categoryId: item.categoryId || '',
          isActive: true,
          imageUrl: item.imageUrl || '',
          modifiers: (item.modifiers || []).map((mod: any) => ({
            id: mod.id || mod.menuItemModifierId,
            name: mod.name,
            price: Number(mod.price || 0),
            tax: Number(mod.tax || 0),
            selected: true, // Modifiers from editOrderData are selected
          })),
        },
        quantity: item.quantity || 1,
        selectedModifiers: (item.modifiers || []).map((mod: any) => ({
          id: mod.id || mod.menuItemModifierId,
          name: mod.name,
          price: Number(mod.price || 0) + Number(mod.tax || 0),
          selected: true,
        })),
        totalPrice: (Number(item.price) + Number(item.taxRate) / 100 + (item.modifiers || []).reduce((sum: number, mod: any) => sum + Number(mod.price || 0), 0)) * (item.quantity || 1),
        basePrice: Number(item.price) + Number(item.taxRate) / 100,
        price: Number(item.price) + Number(item.taxRate) / 100,
        taxRate: Number(item.taxRate) || 0,
      }));
    }
    return [];
  });

  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>(() => {
    return editOrderData?.orderType === 'TAKEAWAY' || editOrderData?.orderType === 'TAKEOUT'
      ? 'TAKEAWAY'
      : 'DINE_IN';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [occupiedTables, setOccupiedTables] = useState<Set<string>>(new Set());
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string>(editOrderData?.tableNumber || '');
  const [customerName, setCustomerName] = useState<string>(editOrderData?.customerName || '');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>(() => {
    // If we have editOrderData, set the restaurant ID
    return editOrderData?.restaurantId || editOrderData?.restaurant?.id || '';
  });
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!editOrderId || hasProcessedEditOrder.current) return;

      setIsLoadingOrder(true);
      try {
        const response = await orderApi.getOrder(editOrderId);
        const orderData = response.data.data;
console.log(orderData,"orderData")
        // Update cart with order items
        if (orderData.items) {
          const updatedCart = orderData.items.map((item: any) => {
            const matchedItem = menuItems.find((menuItem: MenuItem) => menuItem.id === item.menuItemId);
            const basePrice = Number(item.price) + Number(item.taxRate) / 100;
            const modifiersTotal = (item.modifiers || []).reduce(
              (sum: number, mod: any) => sum + Number(mod.price || 0),
              0
            );

            return {
              id: Math.random().toString(36).substr(2, 9),
              item: {
                id: item.menuItemId || item.id,
                name: item.name || matchedItem?.name || 'Unknown Item',
                price: basePrice,
                description: matchedItem?.description || item.description || '',
                categoryId: matchedItem?.categoryId || item.categoryId || '',
                isActive: true,
                imageUrl: matchedItem?.imageUrl || item.imageUrl || '',
                modifiers: (matchedItem?.modifiers || item.modifiers || []).map((mod: any) => ({
                  id: mod.id || mod.menuItemModifierId,
                  name: mod.name,
                  price: Number(mod.price || 0),
                  tax: Number(mod.tax || 0),
                  selected: (item.modifiers || []).some((m: any) => (m.id || m.menuItemModifierId) === (mod.id || mod.menuItemModifierId)),
                })),
              },
              quantity: item.quantity || 1,
              selectedModifiers: (item.modifiers || []).map((mod: any) => ({
                id: mod.id || mod.menuItemModifierId,
                name: mod.name,
                price: Number(mod.price || 0) + Number(mod.tax || 0),
                selected: true,
              })),
              totalPrice: (basePrice + modifiersTotal) * (item.quantity || 1),
              basePrice: basePrice,
              price: basePrice,
              taxRate: Number(item.taxRate) || 0,
            };
          });
          console.log(updatedCart, "updatedCart");
          setCart(updatedCart);
        }

        // Update form fields
        setOrderType(orderData.orderType === 'TAKEAWAY' ? 'TAKEAWAY' : 'DINE_IN');

        // Find branch by name and set its ID
        const branchByName = branches.find(branch => branch.name === orderData.branchName);
        const branchById = branchByName?.id || null;

        // If branch lookup by name fails, try to find by other methods
        let finalBranchId = branchById;
        if (!finalBranchId && orderData.branchName) {
          // Try case-insensitive match
          const caseInsensitiveMatch = branches.find(branch =>
            branch.name.toLowerCase() === orderData.branchName.toLowerCase()
          );
          finalBranchId = caseInsensitiveMatch?.id || null;

          // If still not found, try partial match
          if (!finalBranchId) {
            const partialMatch = branches.find(branch =>
              branch.name.toLowerCase().includes(orderData.branchName.toLowerCase()) ||
              orderData.branchName.toLowerCase().includes(branch.name.toLowerCase())
            );
            finalBranchId = partialMatch?.id || null;
          }
        }

        setSelectedBranch(finalBranchId);
        setTableNumber(orderData.tableNumber || '');
        setCustomerName(orderData.customerName || '');
        setSelectedRestaurant(orderData.restaurantId || orderData.restaurant?.id || '');

        hasProcessedEditOrder.current = true;
      } catch (error) {
        console.error('Error fetching order data:', error);
        toast.error('Failed to load order data');
      } finally {
        setIsLoadingOrder(false);
      }
    };

    fetchOrderData();
  }, [editOrderId, menuItems, branches]);

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

  const handleOrderTypeChange = useCallback((type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY') => {
    setOrderType(type);
  }, []);

  const handleRestaurantChange = useCallback((restaurantId: string) => {
    console.log('Restaurant changed:', restaurantId);
    setSelectedRestaurant(restaurantId);
    setSelectedBranch(null); // Reset branch when restaurant changes
    setFilteredBranches(branches.filter(branch => branch.restaurantId === restaurantId));
  }, [branches]);

  // Get user information for branch filtering
  const { user, isAdmin } = useUser();

  // Set initial branch when user data is loaded
  useEffect(() => {
    if (user) {
      if (!isAdmin && user.branch && !selectedBranch) {
        setSelectedBranch(user.branch);
      }
    }
  }, [user, isAdmin, selectedBranch]);

  // Fetch restaurants and branches on component mount
  useEffect(() => {
    const loadRestaurantsAndBranches = async () => {
      try {
        setIsLoadingRestaurants(true);
        setIsLoadingBranches(true);

        const restaurantsResponse = await restaurantApi.getActiveRestaurants();
        console.log('Restaurants API response:', restaurantsResponse);
        console.log('Restaurants response data:', restaurantsResponse.data);
        console.log('Restaurants data type:', typeof restaurantsResponse.data);
        console.log('Restaurants data is array:', Array.isArray(restaurantsResponse.data));

        // Handle different response structures
        let restaurantsData;
        if (Array.isArray(restaurantsResponse.data)) {
          restaurantsData = restaurantsResponse.data;
        } else if (restaurantsResponse.data && Array.isArray(restaurantsResponse.data.data)) {
          restaurantsData = restaurantsResponse.data.data;
        } else if (restaurantsResponse.data && typeof restaurantsResponse.data === 'object' && restaurantsResponse.data.data) {
          restaurantsData = Array.isArray(restaurantsResponse.data.data) ? restaurantsResponse.data.data : [restaurantsResponse.data.data];
        } else {
          restaurantsData = [];
        }

        console.log('Final restaurants data:', restaurantsData);
        setRestaurants(restaurantsData);

        const branchesResponse = await branchApi.getActiveBranches();
        console.log('Branches API response:', branchesResponse);
        console.log('Branches response data:', branchesResponse.data);
        console.log('Branches data type:', typeof branchesResponse.data);
        console.log('Branches data is array:', Array.isArray(branchesResponse.data));

        // Handle different response structures
        let branchesData: Branch[] = [];
        const branchesResponseData = (branchesResponse as any).data;

        if (Array.isArray(branchesResponseData)) {
          branchesData = branchesResponseData;
        } else if (branchesResponseData && typeof branchesResponseData === 'object') {
          if (Array.isArray(branchesResponseData.data)) {
            branchesData = branchesResponseData.data;
          } else if (branchesResponseData.data) {
            branchesData = Array.isArray(branchesResponseData.data) ? branchesResponseData.data : [branchesResponseData.data];
          }
        }

        // If no branches from API, use fallback data
        if (branchesData.length === 0) {
          console.warn('No branches received from API, using fallback data');
          branchesData = [
            { id: '1', name: 'Main Branch', restaurantId: '1', isActive: true, serviceType: 'BOTH', country: 'UK', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          ];
        }

        console.log('Final branches data:', branchesData);
        setBranches(branchesData);

        if (!isAdmin && user?.branch) {
          const userBranch = branchesData.find(branch => branch.name === user.branch);
          if (userBranch) {
            setSelectedRestaurant(userBranch.restaurant?.id);
            setFilteredBranches([userBranch]);
            setSelectedBranch(userBranch.id);
          }
        }
      } catch (error) {
        console.error('Error loading restaurants and branches:', error);
        toast.error('Failed to load restaurants and branches');
      } finally {
        setIsLoadingRestaurants(false);
        setIsLoadingBranches(false);
      }
    };

    if (isAdmin || user) {
      loadRestaurantsAndBranches();
    }
  }, [isAdmin, user]);

  // Filter branches when restaurant selection changes
  useEffect(() => {
    console.log('Branch filtering triggered:', { selectedRestaurant, branches: branches.length });
    if (selectedRestaurant) {
      const filtered = (branches || []).filter(branch => branch.restaurantId === selectedRestaurant);
      console.log('Filtered branches:', filtered);
      setFilteredBranches(filtered);
      if (selectedBranch && !filtered.find(branch => branch.id === selectedBranch)) {
        console.log('Clearing selected branch because it\'s not in filtered list');
        setSelectedBranch(null);
      }
    } else {
      console.log('No restaurant selected, clearing filtered branches');
      setFilteredBranches([]);
      setSelectedBranch(null);
    }
  }, [selectedRestaurant, branches, selectedBranch]);

  // Fetch occupied tables when branch changes
  useEffect(() => {
    fetchOccupiedTables();
  }, [selectedBranch, filteredBranches]);

  const fetchOccupiedTables = async () => {
    if (!selectedBranch) {
      setOccupiedTables(new Set());
      return;
    }

    try {
      setIsLoadingTables(true);
      const branchName = filteredBranches.find(branch => branch.id === selectedBranch)?.name;
      if (!branchName) {
        setOccupiedTables(new Set());
        return;
      }

      const response = await orderApi.getOrdersByBranch(branchName);
      const orders = response.data || [];

      // Filter for occupied tables (orders that are not completed, cancelled, or paid)
      const occupiedTableNumbers = new Set(
        orders
          .filter(order =>
            order.tableNumber &&
            !['COMPLETED', 'CANCELLED'].includes(order.status || '') &&
            order.paymentStatus !== 'PAID'
          )
          .map(order => order.tableNumber)
      );

      setOccupiedTables(occupiedTableNumbers);
    } catch (error) {
      console.error('Error fetching occupied tables:', error);
      setOccupiedTables(new Set());
      setTableError('Failed to load table occupancy data');
    } finally {
      setIsLoadingTables(false);
    }
  };

  // Set up WebSocket listener for order updates
  useEffect(() => {
    const handleOrderUpdate = (data: any) => {
      if (['COMPLETED', 'CANCELLED', 'PAID'].includes(data.status) || data.paymentStatus === 'PAID') {
        // Refresh occupied tables when an order status changes
        fetchOccupiedTables();
        if (data.tableNumber === tableNumber) {
          setTableNumber('');
        }
      }
    };

    if (window.Echo && typeof window.Echo.channel === 'function') {
      const channel = window.Echo.channel('orders') as any;
      if (channel) {
        channel
          .listen('OrderStatusUpdated', handleOrderUpdate)
          .listen('PaymentStatusUpdated', (data: any) => {
            if (data.paymentStatus === 'PAID') {
              // Refresh occupied tables when payment status changes
              fetchOccupiedTables();
              if (data.tableNumber === tableNumber) {
                setTableNumber('');
              }
            }
          });
      }
    }

    return () => {
      if (window.Echo && typeof window.Echo.leaveChannel === 'function') {
        window.Echo.leaveChannel('orders');
      }
    };
  }, [selectedBranch, tableNumber, filteredBranches]);

  const { hasPermission } = usePermissions();
  const canCreateMenuItems = hasPermission('MENU_CREATE');

  // Determine back button destination based on permissions
  const getBackButtonDestination = () => {
    // Priority 1: If manager has DASHBOARD_READ permission, go to dashboard
    if (hasPermission('DASHBOARD_READ')) {
      return '/dashboard';
    }

    // Priority 2: If manager has ORDER_READ permission, go to orders
    if (hasPermission('ORDER_READ')) {
      return '/dashboard/orders';
    }

    // Priority 3: If manager has MENU_READ permission, go to menu
    if (hasPermission('MENU_READ')) {
      return '/dashboard/menu';
    }

    // Priority 4: If manager has USER_READ permission, go to users
    if (hasPermission('USER_READ')) {
      return '/dashboard/users';
    }

    // Fallback: Go to dashboard
    return '/dashboard';
  };

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiParams: any = {};
        if (!isAdmin && user?.branch) {
          // Get the branch name whether it's a string or an object
          const branchName = typeof user.branch === 'object' ? user.branch.name || user.branch.id : user.branch;
          
          // Only proceed if we have a branch name
          if (branchName) {
            const normalizedBranch = typeof branchName === 'string' && branchName.startsWith('branch')
              ? branchName
                  .replace('branch1', 'Main Branch')
                  .replace('branch2', 'Downtown Branch')
                  .replace('branch3', 'Uptown Branch')
                  .replace('branch4', 'Westside Branch')
                  .replace('branch5', 'Eastside Branch')
              : branchName;
              
            apiParams.branchName = normalizedBranch;
            console.log('Branch name normalization:', {
              original: branchName,
              normalized: normalizedBranch,
              isAdmin,
              userBranch: user.branch
            });
          }
        }

        const [categoriesResponse, itemsResponse] = await Promise.allSettled([
          categoryApi.getCategories(apiParams),
          menuItemApi.getItems(apiParams),
        ]);
        
        const categoriesResponseData = categoriesResponse.status === 'fulfilled'
          ? (categoriesResponse.value?.data as any)?.data || []
          : [];
        const itemsResponseData = itemsResponse.status === 'fulfilled'
          ? (itemsResponse.value?.data as any)?.data || []
          : [];

        const categoriesData: Category[] = Array.isArray(categoriesResponseData)
          ? categoriesResponseData
          : categoriesResponseData && typeof categoriesResponseData === 'object'
            ? [categoriesResponseData]
            : [];

        const itemsData: MenuItem[] = Array.isArray(itemsResponseData)
          ? itemsResponseData
          : itemsResponseData && typeof itemsResponseData === 'object'
            ? [itemsResponseData]
            : [];

        setCategories(categoriesData);

        if (itemsData.length === 0) {
          setMenuItems([]);
          setIsLoading(false);
          return;
        }

        const itemsWithCategory = itemsData.map((item: any) => {
          let categoryName = 'Uncategorized';
          if (item.category) {
            categoryName = item.category.name;
          } else if (item.categoryId && categoriesData.length > 0) {
            const category = categoriesData.find((cat: Category) => cat.id === item.categoryId);
            categoryName = category?.name || 'Uncategorized';
          }

          return {
            ...item,
            category: categoryName,
            description: item.description || '',
            categoryId: item.categoryId || item.category?.id || '',
            price: item.price || 0,
            taxRate: item.taxRate || 0,
            isActive: item.isActive !== undefined ? item.isActive : true,
            taxExempt: item.taxExempt || false,
            modifiers: (item.modifiers || []).map((mod: any) => ({
              ...mod,
              selected: false, // Ensure modifiers are not selected by default
              price: Number(mod.price || 0),
              tax: Number(mod.tax || 0),
            })),
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

  const addToCart = useCallback((menuItem: MenuItem, modifiers: Array<{ id: string; name: string; price: number }> = []) => {
    setCart(prevCart => {
      // Find existing item without considering modifiers initially
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.item.id === menuItem.id && JSON.stringify(cartItem.selectedModifiers.map(m => m.id).sort()) === JSON.stringify(modifiers.map(m => m.id).sort()));

      // Create a new menu item with tax-included price
      const menuItemWithTax = {
        ...menuItem,
        price: Number(menuItem.price) * (1 + (Number(menuItem.taxRate) / 100)),
        modifiers: (menuItem.modifiers || []).map(mod => ({
          ...mod,
          selected: modifiers.some(m => m.id === mod.id), // Only select modifiers passed in
          price: Number(mod.price || 0),
          tax: Number(mod.tax || 0),
        })),
      };

      // Initialize selectedModifiers with only explicitly provided modifiers
      const selectedModifiers = modifiers.map(mod => ({
        id: mod.id,
        name: mod.name,
        price: Number(mod.price) * (1 + (Number(menuItem.taxRate) / 100)),
        selected: true,
      }));

      // Calculate total price with only base price unless modifiers are provided
      const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0);
      const itemTotal = (menuItemWithTax.price + modifiersTotal) * 1; // Quantity is 1 initially

      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];
        updatedCart[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + 1,
          totalPrice: (menuItemWithTax.price + modifiersTotal) * (existingItem.quantity + 1),
          selectedModifiers,
        };
        return updatedCart;
      }

      // Add new item to cart
      return [
        ...prevCart,
        {
          id: Math.random().toString(36).substr(2, 9),
          item: menuItemWithTax,
          quantity: 1,
          selectedModifiers,
          totalPrice: itemTotal,
          basePrice: menuItemWithTax.price,
          price: menuItemWithTax.price,
          taxRate: Number(menuItem.taxRate) || 0,
        } as CartItem,
      ];
    });
  }, []);

  const updateCartItemQuantity = useCallback((index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(index);
      return;
    }

    setCart(prevCart => {
      const newCart = [...prevCart];
      const item = newCart[index];

      if (item) {
        const modifiersTotal = (item.selectedModifiers || []).reduce((sum, mod) => sum + Number(mod.price || 0), 0);
        const pricePerItem = Number(item.item.price) + modifiersTotal;
        newCart[index] = {
          ...item,
          quantity: newQuantity,
          totalPrice: pricePerItem * newQuantity,
        };
      }

      return newCart;
    });
  }, []);

  const removeFromCart = useCallback((index: number) => {
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
  }, []);

  const handleOrderPlaced = async (orderId?: string) => {
    if (editOrderData?.data?.id) {
      try {
        const response = await orderApi.getOrder(editOrderData.data.id);
        if (response?.data) {
          editOrderData({
            ...editOrderData,
            data: response.data,
          });
        }
      } catch (error) {
        console.error('Error refreshing order data:', error);
      }
    }

    if (orderType === 'DINE_IN' && tableNumber) {
      setTableNumber('');
    }

    setCart([]);
    await fetchOccupiedTables(); // Fetch updated occupied tables after order is placed

    toast.success(editOrderData?.data?.id ? 'Order updated successfully!' : 'Order placed successfully!');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, cartItem) => sum + cartItem.totalPrice, 0);
  }, [cart]);

  const tax = 0; // Tax is already included in item.price
  const total = subtotal;

  const filteredItems = useMemo(() => {
    if (isLoading || error) return [];

    let result = [...menuItems];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }
    
    return result;
  }, [menuItems, searchQuery, selectedCategory, isLoading, error]);

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
console.log(error,"error")
  if (error) {
    if (error !== 'No menu items or categories found') {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Menu</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-2 sm:p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button asChild variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <Link href={getBackButtonDestination()} className="flex items-center">
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

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="w-full md:w-3/5 p-2 sm:p-4 md:p-6 overflow-y-auto">
          <div className="mb-4 sm:mb-6">
            <div className="overflow-x-auto pb-2">
              <MenuCategories
                categories={['All', ...(categories || []).map(cat => cat.name)]}
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

        <div
          className="fixed bottom-0 left-0 right-0 z-50 md:static md:z-10 md:w-2/5 bg-white border-t md:border-l border-gray-200 shadow-lg md:shadow-none flex flex-col transition-transform duration-300 ease-in-out transform translate-y-full md:translate-y-0"
          style={{
            height: '80vh',
            maxHeight: 'calc(100vh - 4rem)',
            top: 'auto',
            bottom: 0,
            zIndex: 50,
          }}
          id="order-summary-panel"
        >
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

          <div className="flex-1 overflow-y-auto">
            <div className="h-full flex flex-col">
              <OrderSummary
                cart={cart}
                onUpdateCart={setCart}
                onClearCart={handleClearCart}
                subtotal={subtotal}
                tax={tax}
                total={total}
                onBranchChange={handleBranchChange}
                onTableNumberChange={handleTableNumberChange}
                onCustomerNameChange={handleCustomerNameChange}
                onRestaurantChange={handleRestaurantChange}
                selectedBranch={selectedBranch}
                selectedRestaurant={selectedRestaurant}
                tableNumber={tableNumber}
                customerName={customerName}
                onOrderPlaced={handleOrderPlaced}
                userBranch={typeof user?.branch === 'object' ? user.branch.name : user?.branch}
                orderType={orderType}
                onOrderTypeChange={handleOrderTypeChange}
                occupiedTables={occupiedTables}
                isLoadingTables={isLoadingTables}
                tableError={tableError}
                isEditMode={!!editOrderId}
                editOrderData={editOrderData}
                menuItems={menuItems}
                restaurants={restaurants}
                branches={branches}
                filteredBranches={filteredBranches}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}