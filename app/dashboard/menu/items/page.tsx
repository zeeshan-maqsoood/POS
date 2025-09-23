"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { MenuItemsTable } from "@/components/admin/menu/menu-items-table"
import PermissionGate from "@/components/auth/permission-gate"
import { MenuItem } from "@/lib/menu-api"
import { menuItemApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"
import { useUser } from "@/hooks/use-user"

// This component is a client component that will be rendered inside the dashboard layout
export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: userLoading, isAdmin } = useUser()

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true)

      // For managers, filter by their branch. For admins, show all items.
      const params: any = {
        include: 'category,modifiers',
        status: 'all'
      }

      // If user is a manager (not admin), filter by their branch
      if (user && !isAdmin && user.branch) {
        params.branchName = user.branch
        console.log('Filtering menu items by branch:', user.branch)
      } else {
        console.log('User branch info:', {
          user: user,
          isAdmin: isAdmin,
          userBranch: user?.branch
        })
      }

      console.log('API request params:', params)

      const response = await menuItemApi.getItems(params)
      console.log('API response:', response.data)

      // If manager gets no items but there might be items without branchName, try fetching all
      if (response.data.data.length === 0 && user && !isAdmin && user.branch) {
        console.log('No items found with branch filter, trying without filter...')
        const fallbackResponse = await menuItemApi.getItems({
          include: 'category,modifiers',
          status: 'all'
        })
        console.log('Fallback API response:', fallbackResponse.data)
        setMenuItems(fallbackResponse.data.data)
        setError(null)
      } else {
        setMenuItems(response.data.data)
        setError(null)
      }
    } catch (err) {
      console.error("Failed to fetch menu items:", err)
      setError("Failed to load menu items. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load menu items.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Wait for user data to load before fetching menu items
    if (!userLoading) {
      fetchMenuItems()
    }
  }, [userLoading, user, isAdmin])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return

    try {
      await menuItemApi.deleteItem(id)
      toast({
        title: "Success",
        description: "Menu item deleted successfully.",
      })
    } catch (err) {
      console.error("Failed to delete menu item:", err)
      toast({
        title: "Error",
        description: "Failed to delete menu item.",
        variant: "destructive",
      })
    }
  }

  const handleToggleStatus = async (id: string, isAvailable: boolean) => {
    try {
      await menuItemApi.updateItem(id, { isActive: !isAvailable })
      toast({
        title: "Success",
        description: `Menu item marked as ${!isAvailable ? 'available' : 'unavailable'}.`,
      })
      fetchMenuItems() // Refresh the list
    } catch (err) {
      console.error("Failed to update menu item status:", err)
      toast({
        title: "Error",
        description: "Failed to update menu item status.",
        variant: "destructive",
      })
    }
  }

  if (userLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage your menu items, categories, and modifiers"
              : `Manage menu items for ${user?.branch} branch`
            }
          </p>
        </div>
        <PermissionGate required="MENU_CREATE">
          <Button asChild>
            <Link href="/dashboard/menu/items/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Menu Item
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Items</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "View and manage all menu items"
                  : `View and manage menu items for ${user?.branch} branch`
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-center text-destructive">
              {error}
              <Button
                variant="outline"
                className="mt-2"
                onClick={fetchMenuItems}
              >
                Retry
              </Button>
            </div>
          ) : (
            <MenuItemsTable
              data={menuItems}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              isLoading={isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
