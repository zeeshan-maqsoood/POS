import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Order } from '@/types/order.types';

export const useSocket = () => {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    // Initialize socket connection
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      path: '/socket.io/',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      
      // Authenticate with the server
      socket.emit('authenticate', user.id);
      
      // Join branch room
      if (user.branch) {
        socket.emit('join-branch', user.branch);
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);
    });

    // Handle errors
    socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    // Store the socket instance
    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, token]);

  // Listen for new orders
  const onNewOrder = useCallback((callback: (order: Order) => void) => {
    if (!socketRef.current) return;

    const handler = (data: { order: Order }) => {
      console.log('New order received:', data);
      toast({
        title: 'New Order',
        description: `New order #${data.order.id} received`,
      });
      callback(data.order);
    };

    socketRef.current.on('new-order', handler);
    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-order', handler);
      }
    };
  }, []);

  // Listen for order updates
  const onOrderUpdate = useCallback((callback: (order: Order) => void) => {
    if (!socketRef.current) return;

    const handler = (data: { order: Order }) => {
      console.log('Order updated:', data);
      toast({
        title: 'Order Updated',
        description: `Order #${data.order.id} has been updated`,
      });
      callback(data.order);
    };

    socketRef.current.on('order-updated', handler);
    return () => {
      if (socketRef.current) {
        socketRef.current.off('order-updated', handler);
      }
    };
  }, []);

  // Emit order status update
  const updateOrderStatus = useCallback((orderId: string, status: string) => {
    if (socketRef.current) {
      socketRef.current.emit('update-order-status', { orderId, status });
    }
  }, []);

  return {
    socket: socketRef.current,
    onNewOrder,
    onOrderUpdate,
    updateOrderStatus,
  };
};
