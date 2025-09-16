// This file provides TypeScript types for Prisma enums to avoid direct dependency on @prisma/client

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
}

export enum Permission {
  // User permissions
  USER_CREATE = 'USER_CREATE',
  USER_READ = 'USER_READ',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  
  // Manager permissions
  MANAGER_CREATE = 'MANAGER_CREATE',
  MANAGER_READ = 'MANAGER_READ',
  MANAGER_UPDATE = 'MANAGER_UPDATE',
  
  // Order permissions
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_READ = 'ORDER_READ',
  ORDER_UPDATE = 'ORDER_UPDATE',
  ORDER_DELETE = 'ORDER_DELETE',
  
  // Product permissions
  PRODUCT_CREATE = 'PRODUCT_CREATE',
  PRODUCT_READ = 'PRODUCT_READ',
  PRODUCT_UPDATE = 'PRODUCT_UPDATE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  
  // Menu permissions
  MENU_CREATE = 'MENU_CREATE',
  MENU_READ = 'MENU_READ',
  MENU_UPDATE = 'MENU_UPDATE',
  MENU_DELETE = 'MENU_DELETE',
}
