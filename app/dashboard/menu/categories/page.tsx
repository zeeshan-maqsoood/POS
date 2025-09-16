"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { CategoriesTable } from "@/components/admin/menu/categories-table"
import { Category, categoryApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await categoryApi.getCategories({ status: 'all' })
      
      // ✅ API returns categories in response.data.data
      setCategories(response.data.data)  
      
      setError(null)
    } catch (err) {
      console.error("Failed to fetch categories:", err)
      setError("Failed to load categories. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load categories.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(() => {
    fetchCategories()
  }, [])

  const handleEdit = (category: Category) => {
    // Redirect to form page for editing
    router.push(`/dashboard/menu/categories/${category.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return
    }

    try {
      await categoryApi.deleteCategory(id)
      toast({
        title: "Success",
        description: "Category deleted successfully.",
      })
      // Refresh list
      await fetchCategories()
    } catch (err: any) {
      console.error("Failed to delete category:", err)

      let errorMessage = "Failed to delete category. Please try again."

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your menu items into categories
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/menu/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Categories</CardTitle>
              <CardDescription>
                View and manage your menu categories
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-center text-destructive">
              {error}
              <Button variant="outline" className="mt-2" onClick={fetchCategories}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <CategoriesTable
                data={categories}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={isLoading}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}