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
import PermissionGate from "@/components/auth/permission-gate"
import { useUser } from "@/hooks/use-user"

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: userLoading, isAdmin } = useUser()

  const fetchCategories = async () => {
    try {
      setIsLoading(true)

      // For managers, filter by their branch. For admins, show all categories.
      const params: any = { status: 'all' }

      // If user is a manager (not admin), filter by their branch
      if (user && !isAdmin && user.branch) {
        // Normalize the branch name for the API call
        const normalizedBranchName = user.branch.startsWith('branch')
          ? user.branch.replace('branch1', 'Main Branch')
            .replace('branch2', 'Downtown Branch')
            .replace('branch3', 'Uptown Branch')
            .replace('branch4', 'Westside Branch')
            .replace('branch5', 'Eastside Branch')
          : user.branch;
        params.branchName = normalizedBranchName
        console.log('Filtering categories by branch:', user.branch, '->', normalizedBranchName)
      } else {
        console.log('User branch info:', {
          user: user,
          isAdmin: isAdmin,
          userBranch: user?.branch
        })
      }

      console.log('Categories API request params:', params)

      const response = await categoryApi.getCategories(params)
      console.log('Categories API response:', response.data)

      // If manager gets no categories but there might be categories without branchName, try fetching all
      if (response.data.data.length === 0 && user && !isAdmin && user.branch) {
        console.log('No categories found with branch filter, trying without filter...')
        const fallbackResponse = await categoryApi.getCategories({ status: 'all' })
        console.log('Fallback categories API response:', fallbackResponse.data)
        setCategories(fallbackResponse.data.data)
        setError(null)
      } else {
        setCategories(response.data.data)
        setError(null)
      }
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
    // Wait for user data to load before fetching categories
    if (!userLoading) {
      fetchCategories()
    }
  }, [userLoading, user, isAdmin])

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
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Organize your menu items into categories"
              : `Manage categories for ${user?.branch} branch`
            }
          </p>
        </div>
        <PermissionGate required="MENU_CREATE">
          <Button asChild>
            <Link href="/dashboard/menu/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Link>
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Categories</CardTitle>
              <CardDescription>
                {isAdmin
                  ? "View and manage all menu categories"
                  : `View and manage categories for ${user?.branch} branch`
                }
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