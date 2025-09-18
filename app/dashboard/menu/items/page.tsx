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

// This component is a client component that will be rendered inside the dashboard layout
export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true)
      const response = await menuItemApi.getItems({
        include: 'category,modifiers',
        status: 'all'
      })
      setMenuItems(response.data.data)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch menu items:", err)
      setError("Failed to load Xmenu items. Please try again later.")
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
    fetchMenuItems()
  }, [])
console.log(menuItems,"menuItems")
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return
    
    try {
      await menuItemApi.deleteItem(id)
      toast({
        title: "Success",
        description: "Menu item deleted successfully.",
      })
      fetchMenuItems() // Refresh the list
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Menu Items</h1>
          <p className="text-muted-foreground">
            Manage your menu items, categories, and modifiers
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
                View and manage your menu items
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
