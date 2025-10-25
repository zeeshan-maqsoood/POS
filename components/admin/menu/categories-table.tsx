"use client"

import * as React from "react"
import { Category } from "@/lib/menu-api"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
  ImageIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import PermissionGate from "@/components/auth/permission-gate"

interface CategoriesTableProps {
  data: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
}

export function CategoriesTable({
  data,
  onEdit,
  onDelete,
  isLoading = false,
}: CategoriesTableProps) {
  const [openDropdownId, setOpenDropdownId] = React.useState<string | null>(null);

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.original.imageUrl;
        return (
          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={row.original.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        );
      },
    },
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
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => {
        const branch = row.original.branch;
        const branchId = row.original.branchId;
        const branchName = row.original.branchName;

        return (
          <div className="text-sm">
            {branch?.name || branchName || (!branchId ? 'All Branches' : `Branch ID: ${branchId}`)}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const category = row.original;
        const isOpen = openDropdownId === category.id;

        return (
          <div className="relative">
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label="Open menu"
              onClick={(e) => {
                e.stopPropagation();
                setOpenDropdownId(isOpen ? null : category.id);
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {isOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                tabIndex={-1}
              >
                <div className="py-1" role="none">
                  <PermissionGate required="MENU_UPDATE" disableInsteadOfHide>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(category);
                        setOpenDropdownId(null);
                      }}
                      className="text-gray-700 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 relative"
                      role="menuitem"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      <Pencil className="mr-2 h-4 w-4 inline" />
                      Edit
                    </button>
                  </PermissionGate>
                  <PermissionGate required="MENU_DELETE" disableInsteadOfHide>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await onDelete(category.id);
                          setOpenDropdownId(null);
                        } catch (error) {
                          console.error("Delete failed", error);
                        }
                      }}
                      className="text-red-600 block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                      disabled={isLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4 inline" />
                      Delete
                    </button>
                  </PermissionGate>
                </div>
              </div>
            )}
          </div>
        );
      },
    },
  ]

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <span className="ml-2 text-muted-foreground">
          Loading categories...
        </span>
      </div>
    );
  }

  

  return (
    <div onClick={() => setOpenDropdownId(null)}>
      <DataTable columns={columns} data={data} searchKey="name" />
    </div>
  );
}