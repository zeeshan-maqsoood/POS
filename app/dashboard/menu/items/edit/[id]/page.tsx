"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MenuItemForm } from "@/components/admin/menu/menu-item-form"
import { MenuItem } from "@/lib/menu-api"
import { menuItemApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const response = await menuItemApi.getItem(params.id)
        setMenuItem(response.data.data)
      } catch (error) {
        console.error("Failed to fetch menu item:", error)
        toast({
          title: "Error",
          description: "Failed to load menu item data.",
          variant: "destructive",
        })
        router.push("/dashboard/menu/items")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenuItem()
  }, [params.id, router])
console.log(menuItem,"menuItem")
  const handleSubmit = async (data: any) => {
    try {
      await menuItemApi.updateItem(params.id, data)
      toast({
        title: "Success",
        description: "Menu item updated successfully.",
      })
      router.push("/dashboard/menu/items")
    } catch (error) {
      console.error("Failed to update menu item:", error)
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      })
      throw error // Re-throw to let the form handle the error state
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!menuItem) {
    return <div>Menu item not found</div>
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link 
          href="/dashboard/menu/items" 
          className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Menu Items
        </Link>
        <h1 className="text-3xl font-bold">Edit Menu Item</h1>
        <p className="text-muted-foreground">
          Update the details of this menu item
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menu Item Details</CardTitle>
          <CardDescription>
            Update the menu item information below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MenuItemForm 
            initialData={menuItem}
            onSuccess={() => {
              toast({
                title: "Success",
                description: "Menu item updated successfully.",
              })
              router.push("/dashboard/menu/items")
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
