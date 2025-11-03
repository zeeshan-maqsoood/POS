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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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
        const menuItem = row.original;
        return (
          <div className="relative" ref={menuRef}>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === menuItem.id ? null : menuItem.id);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
            
            {openMenuId === menuItem.id && (
              <div 
                className="absolute right-0 z-50 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                role="menu"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1">
                  <PermissionGate required="MENU_UPDATE" disableInsteadOfHide>
                    <button
                      className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        if (onEdit) {
                          onEdit(menuItem.id);
                        } else {
                          window.location.href = `/dashboard/menu/items/edit/${menuItem.id}`;
                        }
                      }}
                    >
                      <Pencil className="mr-3 h-4 w-4 text-gray-500 group-hover:text-gray-600" />
                      Edit Item
                    </button>
                  </PermissionGate>

                  <PermissionGate required="MENU_DELETE" disableInsteadOfHide>
                    <button
                      className="text-red-600 hover:bg-red-50 group flex w-full items-center px-4 py-2 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        if (confirm('Are you sure you want to delete this item?')) {
                          onDelete(menuItem.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-3 h-4 w-4 text-red-500 group-hover:text-red-600" />
                      Delete Item
                    </button>
                  </PermissionGate>
                </div>
              </div>
            )}
          </div>
        )
      },
    },
  ]

  // Handle clicks outside the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when scrolling or resizing
  useEffect(() => {
    const handleScrollOrResize = () => {
      setOpenMenuId(null);
    };

    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
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
