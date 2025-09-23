"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CategoryForm } from "@/components/admin/menu/category-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { WithPermission } from "@/components/auth/with-permission"

export default function NewCategoryPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // The form will handle the redirect after successful submission
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <WithPermission requiredPermission="MENU_CREATE" redirectTo="/dashboard/menu/categories">
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/menu/categories" className="flex items-center">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Categories
              </Link>
            </Button>
            <Button className="text-3xl font-bold mt-2">Add New Category</Button>
            <p className="text-muted-foreground">
              Create a new category for your menu items
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
            <CardDescription>
              Fill in the details for your new category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </WithPermission>
  )
}
