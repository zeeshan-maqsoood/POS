"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/admin/menu/category-form"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Category, categoryApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"
export default function EditCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categoryId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setIsLoading(true)
        const response = await categoryApi.getCategory(categoryId)
        if (response.data?.data) {
          // Map the API response to match the Category type
          const categoryData = response.data.data
          setCategory({
            id: categoryData.id,
            name: categoryData.name,
            description: categoryData.description || '',
            isActive: categoryData.isActive,
            imageUrl: categoryData.imageUrl || '',
            createdAt: categoryData.createdAt,
            updatedAt: categoryData.updatedAt
          })
        }
        setError(null)
      } catch (err) {
        console.error("Failed to fetch category:", err)
        setError("Failed to load category. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load category.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (categoryId) {
      fetchCategory()
    }
  }, [categoryId])

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Category updated successfully.",
    })
    router.push("/dashboard/menu/categories")
  }

  const handleCancel = () => {
    router.back()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading category...</span>
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

  if (!category) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md bg-muted p-4 text-center">
          <p>Category not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/menu/categories">
              Back to Categories
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/menu/categories" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-2">Edit Category</h1>
          <p className="text-muted-foreground">
            Update the details of this category
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>
            Update the details for this category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm 
            initialData={category}
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
