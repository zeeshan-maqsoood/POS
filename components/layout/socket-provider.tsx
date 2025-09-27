// components/layout/socket-provider.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface SocketContextType {
  socket: any; // Replace with your socket type
  onNewOrder: (callback: (order: any) => void) => () => void;
  onOrderUpdate: (callback: (order: any) => void) => () => void;
  updateOrderStatus: (orderId: string, status: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const socket = useSocket();

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};
