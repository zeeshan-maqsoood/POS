// // 'use client';

// // import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
// // import { io, Socket } from 'socket.io-client';
// // import Cookies from 'js-cookie';
// // import type { Order } from '@/types/order';

// export type UserRole =
//   | 'ADMIN'
//   | 'MANAGER'
//   | 'KITCHEN_STAFF'
//   | 'CASHIER'
//   | 'WAITER'
//   | 'USER';

// // interface SocketContextType {
// //   socket: Socket | null;
// //   isConnected: boolean;
// //   joinBranch: (branchId: string, role: UserRole) => void;
// //   onNewOrder: (
// //     callback: (data: { order: Order; createdByRole: string }) => void
// //   ) => () => void;
// //   onOrderUpdate: (
// //     callback: (data: { order: Order; updatedByRole: string }) => void
// //   ) => () => void;
// //   notifyNewOrder: (order: Order) => void;
// //   notifyOrderUpdate: (order: Order) => void;
// // }

// // const SocketContext = createContext<SocketContextType>({
// //   socket: null,
// //   isConnected: false,
// //   joinBranch: () => {},
// //   onNewOrder: () => () => {},
// //   onOrderUpdate: () => () => {},
// //   notifyNewOrder: () => {},
// //   notifyOrderUpdate: () => {},
// // });

// // export const useSocket = () => useContext(SocketContext);

// // export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
// //   children,
// // }) => {
// //   const socketRef = useRef<Socket | null>(null);
// //   const [isConnected, setIsConnected] = useState(false);
// //   const [branchId, setBranchId] = useState<string | null>(null);
// //   const [userRole, setUserRole] = useState<UserRole | null>(null);

// //   useEffect(() => {
// //     const token = Cookies.get('token');
// //     const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// //     console.log('[SocketProvider] Connecting to', url);

// //     const socket = io(url, {
// //       path: '/socket.io/',
// //       transports: ['websocket'],
// //       withCredentials: true,
// //       autoConnect: true,
// //       auth: {
// //         token, // ✅ send JWT on handshake
// //       },
// //     });

// //     socketRef.current = socket;

// //     socket.on('connect', () => {
// //       console.log('[SocketProvider] Connected ✅ with id:', socket.id);
// //       setIsConnected(true);

// //       // if user has already selected a branch, join it
// //       if (branchId && userRole) {
// //         socket.emit('join-branch', { branchId, role: userRole });
// //       }
// //     });

// //     socket.on('disconnect', (reason) => {
// //       console.warn('[SocketProvider] Disconnected ❌:', reason);
// //       setIsConnected(false);
// //     });

// //     socket.on('connect_error', (err) => {
// //       console.error('[SocketProvider] Connection error ⚠️:', err.message);
// //     });

// //     return () => {
// //       console.log('[SocketProvider] Cleaning up...');
// //       socket.disconnect();
// //     };
// //   }, [branchId, userRole]);

// //   const joinBranch = (branchId: string, role: UserRole) => {
// //     if (socketRef.current) {
// //       console.log('[SocketProvider] Joining branch:', branchId, 'as', role);
// //       setBranchId(branchId);
// //       setUserRole(role);
// //       socketRef.current.emit('join-branch', { branchId, role });
// //     }
// //   };

// //   const onNewOrder = (
// //     callback: (data: { order: Order; createdByRole: string }) => void
// //   ) => {
// //     if (!socketRef.current) return () => {};
// //     const handler = (data: { order: Order; createdByRole: string }) => {
// //       console.log('[SocketProvider] Received new order:', data);
// //       callback(data);
// //     };
// //     socketRef.current.on('new-order', handler);
// //     return () => socketRef.current?.off('new-order', handler);
// //   };

// //   const notifyNewOrder = (order: Order) => {
// //     if (socketRef.current && userRole) {
// //       console.log('[SocketProvider] Sending new order:', order);
// //       socketRef.current.emit('new-order', { order, createdByRole: userRole });
// //     }
// //   };

// //   const onOrderUpdate = (
// //     callback: (data: { order: Order; updatedByRole: string }) => void
// //   ) => {
// //     if (!socketRef.current) return () => {};
// //     const handler = (data: { order: Order; updatedByRole: string }) => {
// //       console.log('[SocketProvider] Received order update:', data);
// //       callback(data);
// //     };
// //     socketRef.current.on('order-updated', handler);
// //     return () => socketRef.current?.off('order-updated', handler);
// //   };

// //   const notifyOrderUpdate = (order: Order) => {
// //     if (socketRef.current && userRole) {
// //       console.log('[SocketProvider] Sending order update:', order);
// //       socketRef.current.emit('order-updated', { order, updatedByRole: userRole });
// //     }
// //   };

// //   return (
// //     <SocketContext.Provider
// //       value={{
// //         socket: socketRef.current,
// //         isConnected,
// //         joinBranch,
// //         onNewOrder,
// //         onOrderUpdate,
// //         notifyNewOrder,
// //         notifyOrderUpdate,
// //       }}
// //     >
// //       {children}
// //     </SocketContext.Provider>
// //   );
// // };

// 'use client';

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { io, Socket } from 'socket.io-client';
// import profileApi from '@/lib/profile-api';
// // adjust this if your backend runs elsewhere (e.g., on EC2 or with SSL)
// const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

// interface User {
//   role: string;
//   branch?: string;
//   [key: string]: any; // For any additional user properties
// }

// interface SocketContextType {
//   socket: Socket | null;
//   user: User | null;
//   isConnected: boolean;
//   joinBranch: (branchId: string, role: UserRole) => void;
//   onNewOrder: (callback: (data: { order: any; createdByRole: string }) => void) => () => void;
//   onOrderUpdate: (callback: (data: { order: any; updatedByRole: string }) => void) => () => void;
//   notifyNewOrder: (order: any) => void;
//   notifyOrderUpdate: (order: any) => void;
// }

// const SocketContext = createContext<SocketContextType>({
//   socket: null,
//   user: null,
//   isConnected: false,
//   joinBranch: () => {},
//   onNewOrder: () => () => {},
//   onOrderUpdate: () => () => {},
//   notifyNewOrder: () => {},
//   notifyOrderUpdate: () => {},
// });

// export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [isConnected, setIsConnected] = useState(false);
//   const [user, setUser] = useState<User | null>(null);
//   const [branchId, setBranchId] = useState<string | null>(null);
//   const [userRole, setUserRole] = useState<UserRole | null>(null);

//   useEffect(() => {
//     const initSocket = async () => {
//       try {
//         console.log('[SocketProvider] Connecting to', SOCKET_URL);
        
//         // Fetch user profile
//         const res = await profileApi.getProfile();
//         const userData = res.data.data;
//         setUser(userData);
        
//         // Initialize socket connection
//         const socketInstance = io(SOCKET_URL, {
//           transports: ['websocket'],
//           autoConnect: true,
//         });

//         // Connection events
//         socketInstance.on('connect', () => {
//           console.log('[SocketProvider] Connected ✅ with id:', socketInstance.id);
//           setIsConnected(true);
          
//           // Authenticate with the server
//           socketInstance.emit('authenticate', {
//             userId: userData.id,
//             role: userData.role,
//             ...(userData.branch ? { branchId: userData.branch } : {})
//           });
//         });

//         socketInstance.on('welcome', (data: any) => {
//           console.log('Server welcome:', data);
//         });

//         socketInstance.on('disconnect', (reason: any) => {
//           console.warn('[SocketProvider] Disconnected ❌:', reason);
//           setIsConnected(false);
//         });

//         socketInstance.on('connect_error', (err: { message: any }) => {
//           console.error('[SocketProvider] Connection error ⚠️:', err.message);
//           setIsConnected(false);
//         });

//         setSocket(socketInstance);

//         // Cleanup on unmount
//         return () => {
//           console.log('[SocketProvider] Cleaning up...');
//           socketInstance.disconnect();
//           setIsConnected(false);
//         };
//       } catch (error) {
//         console.error('[SocketProvider] Error initializing socket:', error);
//       }
//     };

//     initSocket();
//   }, []);

//   const joinBranch = (branchId: string, role: UserRole) => {
//     if (socket) {
//       console.log('[SocketProvider] Joining branch:', branchId, 'as', role);
//       setBranchId(branchId);
//       setUserRole(role);
//       socket.emit('join-branch', { branchId, role });
//     }
//   };

//   const onNewOrder = (
//     callback: (data: { order: any; createdByRole: string }) => void
//   ) => {
//     if (!socket) return () => {};
    
//     const handler = (data: { order: any; createdByRole: string }) => {
//       console.log('[SocketProvider] New order received:', data);
//       callback(data);
//     };
    
//     socket.on('new-order', handler);
//     return () => {
//       socket.off('new-order', handler);
//     };
//   };

//   const notifyNewOrder = (order: any) => {
//     if (socket && userRole) {
//       console.log('[SocketProvider] Notifying new order:', order);
//       socket.emit('new-order', { order, createdByRole: userRole });
//     }
//   };

//   const onOrderUpdate = (
//     callback: (data: { order: any; updatedByRole: string }) => void
//   ) => {
//     if (!socket) return () => {};
    
//     const handler = (data: { order: any; updatedByRole: string }) => {
//       console.log('[SocketProvider] Order update received:', data);
//       callback(data);
//     };
    
//     socket.on('order-updated', handler);
//     return () => {
//       socket.off('order-updated', handler);
//     };
//   };

//   const notifyOrderUpdate = (order: any) => {
//     if (socket && userRole) {
//       console.log('[SocketProvider] Notifying order update:', order);
//       socket.emit('order-updated', { order, updatedByRole: userRole });
//     }
//   };

//   return (
//     <SocketContext.Provider
//       value={{
//         socket,
//         user,
//         isConnected,
//         joinBranch,
//         onNewOrder,
//         onOrderUpdate,
//         notifyNewOrder,
//         notifyOrderUpdate,
//       }}
//     >
//       {children}
//     </SocketContext.Provider>
//   );
// };

// export const useSocket = () => useContext(SocketContext);

'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import type { Order } from '@/types/order.types';

export type UserRole = 'ADMIN' | 'MANAGER' | 'KITCHEN_STAFF' | 'CASHIER' | 'WAITER' | 'USER'|"CUSTOMER";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinBranch: (branchId: string, role: UserRole) => void;
  onNewOrder: (callback: (order: Order) => void) => () => void;
  onOrderUpdate: (callback: (update: { orderId: string; status: string }) => void) => () => void;
  notifyNewOrder: (order: Order) => void;
  notifyOrderUpdate: (order: Order) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinBranch: () => {},
  onNewOrder: () => () => {},
  onOrderUpdate: () => () => {},
  notifyNewOrder: () => {},
  notifyOrderUpdate: () => {},
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
      path: '/socket.io/',
      transports: ['websocket'],
      withCredentials: true,
      auth: {
        token: Cookies.get('token'),
      },
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinBranch = useCallback((branchId: string, role: UserRole) => {
    if (socketRef.current) {
      console.log(`Joining branch: ${branchId} as ${role}`);
      socketRef.current.emit('join-branch', { branchId, role });
    }
  }, []);

  const onNewOrder = useCallback((callback: (order: Order) => void) => {
    if (!socketRef.current) return () => {};

    const handler = (data: { order: Order }) => {
      console.log('New order received:', data.order);
      callback(data.order);
    };

    socketRef.current.on('newOrder', handler);
    return () => {
      socketRef.current?.off('newOrder', handler);
    };
  }, []);

  const onOrderUpdate = useCallback((callback: (update: { orderId: string; status: string }) => void) => {
    if (!socketRef.current) return () => {};

    const handler = (data: { orderId: string; status: string }) => {
      console.log('Order update received:', data);
      callback(data);
    };

    socketRef.current.on('orderUpdate', handler);
    return () => {
      socketRef.current?.off('orderUpdate', handler);
    };
  }, []);

  const notifyNewOrder = useCallback((order: Order) => {
    if (socketRef.current) {
      socketRef.current.emit('newOrder', { order });
    }
  }, []);

  const notifyOrderUpdate = useCallback((order: Order) => {
    if (socketRef.current) {
      socketRef.current.emit('orderUpdate', {
        orderId: order.id,
        status: order.status,
      });
    }
  }, []);

  const value = {
    socket,
    isConnected,
    joinBranch,
    onNewOrder,
    onOrderUpdate,
    notifyNewOrder,
    notifyOrderUpdate,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};