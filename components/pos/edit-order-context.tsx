'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Order, orderApi } from '@/lib/order-api';

type EditOrderContextType = {
  isEditing: boolean;
  currentOrder: Order | null;
  setCurrentOrder: (order: Order | null) => void;
  resetEditOrder: () => void;
  newItems: any[];
  addNewItem: (item: any) => void;
  removeNewItem: (itemId: string) => void;
  updateNewItemQuantity: (itemId: string, quantity: number) => void;
};

const EditOrderContext = createContext<EditOrderContextType | undefined>(undefined);

export function EditOrderProvider({ children }: { children: ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [newItems, setNewItems] = useState<any[]>([]);

  const addNewItem = (item: any) => {
    setNewItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      if (existingItem) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeNewItem = (itemId: string) => {
    setNewItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateNewItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeNewItem(itemId);
      return;
    }
    setNewItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const resetEditOrder = () => {
    setCurrentOrder(null);
    setNewItems([]);
  };

  // Load order from URL if editOrderId is present
  useEffect(() => {
    const loadOrder = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get('editOrderId');
      
      if (orderId) {
        try {
          const response = await orderApi.getOrderById(orderId);
          setCurrentOrder(response.data);
        } catch (error) {
          console.error('Error loading order:', error);
        }
      }
    };

    loadOrder();
  }, []);

  return (
    <EditOrderContext.Provider
      value={{
        isEditing: !!currentOrder,
        currentOrder,
        setCurrentOrder,
        resetEditOrder,
        newItems,
        addNewItem,
        removeNewItem,
        updateNewItemQuantity,
      }}
    >
      {children}
    </EditOrderContext.Provider>
  );
}

export const useEditOrder = () => {
  const context = useContext(EditOrderContext);
  if (context === undefined) {
    throw new Error('useEditOrder must be used within an EditOrderProvider');
  }
  return context;
};
