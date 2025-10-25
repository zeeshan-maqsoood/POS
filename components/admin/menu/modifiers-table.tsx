"use client"

import { useState, useEffect, useRef } from "react"
import { Modifier } from "@/lib/menu-api"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import PermissionGate from "@/components/auth/permission-gate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Pencil, Trash2, MoreHorizontal, Loader2 } from "lucide-react"
import Link from "next/link"

interface ModifiersTableProps {
  data: Modifier[]
  onEdit?: (id: string) => void
  onDelete: (id: string) => void
  onToggleStatus?: (id: string, isActive: boolean) => void
  isLoading?: boolean
}

export function ModifiersTable({ 
  data, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  isLoading = false 
}: ModifiersTableProps) {
  const columns: ColumnDef<Modifier>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.name}
          {row.original.description && (
            <div className="text-sm text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "restaurant",
      header: "Restaurant",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.restaurant?.name || 'Global'}
        </Badge>
      ),
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.branch?.name || 'Global'}
        </Badge>
      ),
    },
    {
      accessorKey: "isRequired",
      header: "Required",
      cell: ({ row }) => (
        <Badge variant={row.original.isRequired ? "default" : "outline"}>
          {row.original.isRequired ? "Yes" : "No"}
        </Badge>
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
        const modifier = row.original
        return (
          <div className="relative menu-actions-container">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 p-0 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const menu = document.getElementById(`menu-${modifier.id}`);
                
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
              id={`menu-${modifier.id}`}
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
                {onToggleStatus && (
                  <PermissionGate required="MENU_UPDATE" disableInsteadOfHide>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStatus(modifier.id, !modifier.isActive);
                        document.getElementById(`menu-${modifier.id}`)?.classList.add('hidden');
                      }}
                      className="text-gray-700 group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                      role="menuitem"
                    >
                      <span>{modifier.isActive ? 'Mark as Inactive' : 'Mark as Active'}</span>
                    </button>
                  </PermissionGate>
                )}
                <PermissionGate required="MENU_UPDATE" disableInsteadOfHide>
                  <Link
                    href={`/dashboard/menu/modifiers/${modifier.id}`}
                    className="text-gray-700 group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById(`menu-${modifier.id}`)?.classList.add('hidden');
                    }}
                  >
                    Edit
                  </Link>
                </PermissionGate>
                <PermissionGate required="MENU_DELETE" disableInsteadOfHide>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const menu = document.getElementById(`menu-${modifier.id}`);
                      if (menu) menu.classList.add('hidden');
                      
                      if (confirm('Are you sure you want to delete this modifier? This action cannot be undone.')) {
                        try {
                          await onDelete(modifier.id);
                        } catch (error) {
                          console.error('Error deleting modifier:', error);
                        }
                      }
                    }}
                    className="text-red-600 group flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    role="menuitem"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </PermissionGate>
              </div>
            </div>
          </div>
        )
      },
    },
  ]

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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <span className="ml-2 text-muted-foreground">Loading modifiers...</span>
      </div>
    )
  }

  return <DataTable columns={columns} data={data} searchKey="name" />
}
