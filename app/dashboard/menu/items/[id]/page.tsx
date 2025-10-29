"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MenuItemForm } from "@/components/admin/menu/menu-item-form"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { MenuItem, menuItemApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"
import { WithPermission } from "@/components/auth/with-permission"

function EditMenuItemPageContent() {
  const params = useParams()
  const router = useRouter()
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const menuItemId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        setIsLoading(true)
        const response = await menuItemApi.getItem(menuItemId)
        setMenuItem(response.data.data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch menu item:", err)
        setError("Failed to load menu item. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load menu item.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (menuItemId) {
      fetchMenuItem()
    }
  }, [menuItemId])

  const handleSuccess = () => {
    // The form will handle the redirect after successful submission
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading menu item...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-center">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md bg-muted p-4 text-center">
          <p>Menu item not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/menu/items">
              Back to Menu Items
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <WithPermission requiredPermission="MENU_UPDATE" redirectTo="/unauthorized">
      <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/menu/items" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Menu Items
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-2">Edit Menu Item</h1>
          <p className="text-muted-foreground">
            Update the details of this menu item
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{menuItem.name}</CardTitle>
          <CardDescription>
            Update the details for this menu item
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MenuItemForm 
            initialData={menuItem}
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </CardContent>
      </Card>
      </div>
    </WithPermission>
  )
}
