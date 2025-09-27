import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { toast } from '@/components/ui/use-toast';
import profileApi, { type Profile as ApiProfile } from '@/lib/profile-api';

// Extend the API profile type with any additional properties we need
interface ExtendedProfile extends Omit<ApiProfile, 'branch'> {
  branch?: string | null;
  branchName?: string;
}

interface OrderNotification {
  orderId: string;
  orderNumber: string;
  status: string;
  orderType: string;
  branch: string;
  createdAt: string;
}

export const useOrderNotifications = () => {
    const { onNewOrder, joinBranch, socket, isConnected } = useSocket();
    const [profile, setProfile] = useState<ExtendedProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasJoinedBranch, setHasJoinedBranch] = useState(false);
  
    // Fetch user profile data
    useEffect(() => {
      const fetchProfile = async () => {
        try {
          setIsLoading(true);
          const response = await profileApi.getProfile();
          console.log('📋 User profile loaded:', response.data.data);
          setProfile(response.data.data);
        } catch (error) {
          console.error('❌ Failed to fetch profile:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfile();
    }, []);

    // Handle joining branch when socket connects or profile loads
    useEffect(() => {
      if (isLoading || !profile || !isConnected) return;
      
      // For non-admin users, join their branch room
      if (profile.role !== 'ADMIN' && profile.branch && !hasJoinedBranch) {
        const branchId = profile.branch;
        const branchName = profile.branchName || branchId;
        
        console.log(`🌐 Attempting to join branch: ${branchName} as ${profile.role}`);
        console.log('🔌 Socket connection state:', isConnected ? '✅ Connected' : '❌ Disconnected');
        
        // Small delay to ensure socket is ready
        const timer = setTimeout(() => {
          console.log('🔌 Joining branch with socket state:', {
            connected: socket?.connected,
            id: socket?.id,
            readyState: socket?.readyState
          });
          
          joinBranch(branchId, profile.role as any);
          setHasJoinedBranch(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }, [profile, isConnected, isLoading, joinBranch, hasJoinedBranch, socket]);
  
    // Listen for orders
    useEffect(() => {
      if (!profile) return;

      const handleNewOrder = (order: OrderNotification) => {
        console.group('📦 New Order Notification Received');
        console.log('🔄 Order Data:', order);
        console.log('👤 Current User Role:', profile.role);
        console.log('🏢 Order Branch:', order.branch);
        console.log('👤 User Branch:', profile.branch);
        console.log('🔌 Socket state:', {
          connected: socket?.connected,
          id: socket?.id,
          readyState: socket?.readyState
        });
        console.groupEnd();
        
        // Only show notification if user is admin or the order is from their branch
        if (profile.role === 'ADMIN' || profile.branch === order.branch) {
          toast({
            title: 'New Order Received',
            description: `Order #${order.orderNumber} has been created in ${order.branch}.`,
          });
        }
      };

      const unsubscribe = onNewOrder(handleNewOrder);
  
      // Add direct socket listener for debugging
      const handleDirectSocketEvent = (data: any) => {
        console.log('🔔 Direct socket event received:', data);
        
        // Handle different event formats
        if (data?.orderNumber) {
          // Direct order data
          handleNewOrder(data);
        } else if (data?.order?.orderNumber) {
          // Nested order data (from new-order event)
          handleNewOrder({
            ...data.order,
            // Make sure we have the branch name in the expected format
            branch: data.order.branchName || data.order.branch?.name || 'Unknown Branch'
          });
        } else if (data?.message) {
          console.log('📩 Server message:', data.message);
        }
      };
      
      // Listen to both event names for maximum compatibility
      const events = ['newOrder', 'new-order', 'order:new', 'order_created'];
      events.forEach(event => {
        console.log(`👂 Listening for event: ${event}`);
        socket?.on(event, handleDirectSocketEvent);
      });

      // Log all socket events for debugging
      const logEvent = (event: string, ...args: any[]) => {
        console.log('🔍 Socket event:', event, args);
      };
      
      socket?.onAny(logEvent);
  
      return () => {
        console.log('🧹 Cleaning up order listeners...');
        unsubscribe();
        // Remove all event listeners
        const events = ['newOrder', 'new-order', 'order:new', 'order_created'];
        events.forEach(event => {
          socket?.off(event, handleDirectSocketEvent);
        });
        socket?.offAny(logEvent);
      };
    }, [profile, onNewOrder, socket]);
  };