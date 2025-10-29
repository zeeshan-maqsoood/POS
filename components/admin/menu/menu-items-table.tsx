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
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const menu = document.getElementById(`menu-${menuItem.id}`);
                
                // Hide all other menus
                document.querySelectorAll('.custom-menu-dropdown').forEach(m => {
                  if (m !== menu) m.classList.add('hidden');
                });
                
                // Toggle current menu
                if (menu) {
                  menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
                  menu.style.right = `${window.innerWidth - buttonRect.right}px`;
                  menu.classList.toggle('hidden');
                }
              }}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            
            {/* Custom Dropdown */}
            <div 
              id={`menu-${menuItem.id}`}
              className="custom-menu-dropdown hidden"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              ref={(el) => {
                if (el) {
                  const rect = el.closest('.menu-actions-container')?.getBoundingClientRect();
                  if (rect) {
                    el.style.top = `${rect.bottom + window.scrollY}px`;
                    el.style.right = `${window.innerWidth - rect.right}px`;
                  }
                }
              }}
            >
              <div className="py-1" role="none">

                {/* Single Edit Button */}
                <PermissionGate required="MENU_UPDATE" disableInsteadOfHide>
                  <button
                    className="text-blue-600 group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-blue-50"
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Close the dropdown
                      document.getElementById(`menu-${menuItem.id}`)?.classList.add('hidden');
                      // Navigate programmatically
                      window.location.href = `/dashboard/menu/items/edit/${menuItem.id}`;
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Item
                  </button>
                </PermissionGate>

                {/* Single Delete Button */}
                <PermissionGate required="MENU_DELETE" disableInsteadOfHide>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this item?')) {
                        onDelete(menuItem.id);
                      }
                      document.getElementById(`menu-${menuItem.id}`)?.classList.add('hidden');
                    }}
                    className="text-red-600 group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-red-50"
                    role="menuitem"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        )
      },
    },
  ]

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.menu-actions-container')) {
        document.querySelectorAll('.custom-menu-dropdown').forEach(menu => {
          menu.classList.add('hidden');
        });
      }
    };

    // Add styles for the dropdown menu
    const style = document.createElement('style');
    style.textContent = `
      .custom-menu-dropdown {
        position: fixed;
        z-index: 9999;
        margin-top: 0.25rem;
        width: 14rem;
        border-radius: 0.375rem;
        background-color: white;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        outline: none;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .menu-actions-container {
        position: relative;
        display: inline-block;
      }
    `;
    document.head.appendChild(style);

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.head.removeChild(style);
    };
  }, []);

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
