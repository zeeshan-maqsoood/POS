"use client"

import { useState, useEffect, useRef } from "react"
import type { MenuItem } from "@/lib/menu-api"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import PermissionGate from "@/components/auth/permission-gate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Pencil, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
interface MenuItemsTableProps {
  data: Array<MenuItem & { cost?: number } & { branch?: { id: string; name: string; restaurantId?: string } | null }>
  onEdit?: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string, isActive: boolean) => void
  isLoading?: boolean
}

export function MenuItemsTable({ 
  data, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  isLoading = false 
}: MenuItemsTableProps) {
  type MenuItemWithCost = MenuItem & { cost?: number } & { branch?: { id: string; name: string; restaurantId?: string } | null };
  const columns: ColumnDef<MenuItemWithCost>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
          <div className="text-sm text-muted-foreground">
            {row.original.category?.name || 'No category'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      accessorKey: "branchName",
      header: "Branch",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.branch?.name || row.original.branchName || 'All Branches'}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? (
            <span className="flex items-center">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
            </span>
          ) : (
            <span className="flex items-center">
              <XCircle className="h-3 w-3 mr-1" /> Inactive
            </span>
          )}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const menuItem = row.original
        return (
          <div className="relative menu-actions-container">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 p-0 hover:bg-gray-100 relative menu-actions-container"
              onClick={(e) => {
                e.stopPropagation();
                const button = e.currentTarget as HTMLElement;
                const buttonRect = button.getBoundingClientRect();
                const menu = document.getElementById(`menu-${menuItem.id}`);
                
                // Close all menus first
                closeAllMenus();
                
                if (menu) {
                  // Calculate available space below the button
                  const spaceBelow = window.innerHeight - buttonRect.bottom;
                  const menuHeight = 180; // Approximate height of the menu
                  
                  // Position the menu above or below based on available space
                  if (spaceBelow < menuHeight && buttonRect.top > menuHeight) {
                    // Not enough space below, show above
                    menu.style.top = `${buttonRect.top + window.scrollY - menuHeight - 5}px`;
                  } else {
                    // Enough space below, show below
                    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
                  }
                  
                  // Align right edge with button
                  menu.style.right = `${window.innerWidth - buttonRect.right}px`;
                  
                  // Show the menu
                  menu.classList.remove('hidden');
                }
              }}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {/* Custom Dropdown */}
            <div 
              id={`menu-${menuItem.id}`}
              className="fixed z-50 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden menu-dropdown"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                right: 0,
                zIndex: 50,
                width: '12rem',
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                outline: 'none',
                maxHeight: '60vh',
                overflowY: 'auto',
              }}
            >
              <div className="py-1" role="none">

                {/* Single Edit Button */}
                <div className="py-1" role="none">
                  <PermissionGate required="MENU_UPDATE" disableInsteadOfHide>
                    <button
                      className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex items-center px-4 py-2 text-sm w-full text-left"
                      role="menuitem"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        closeAllMenus();
                        // Small delay to ensure menu is hidden before navigation
                        setTimeout(() => {
                          window.location.href = `/dashboard/menu/items/edit/${menuItem.id}`;
                        }, 100);
                      }}
                    >
                      <Pencil className="mr-3 h-4 w-4 text-gray-500 group-hover:text-gray-600" />
                      Edit Item
                    </button>
                  </PermissionGate>

                  <PermissionGate required="MENU_DELETE" disableInsteadOfHide>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeAllMenus();
                        if (confirm('Are you sure you want to delete this item?')) {
                          onDelete(menuItem.id);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50 group flex items-center px-4 py-2 text-sm w-full text-left"
                      role="menuitem"
                    >
                      <Trash2 className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600" />
                      Delete Item
                    </button>
                  </PermissionGate>

                  {/* Toggle Status Button */}
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
  ]

  // Close menu when clicking outside or when the component unmounts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-actions-container')) {
        closeAllMenus();
      }
    };

    // Close all menus when scrolling
    const handleScroll = () => {
      closeAllMenus();
    };

    // Close all menus when the window is resized
    const handleResize = () => {
      closeAllMenus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      closeAllMenus();
    };
  }, []);

  // Function to close all open menus
  const closeAllMenus = () => {
    document.querySelectorAll('.menu-dropdown').forEach(menu => {
      menu.classList.add('hidden');
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading menu items...</span>
      </div>
    )
  }

  return <DataTable columns={columns} data={data} searchKey="name" />
}
