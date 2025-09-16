"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModifierForm } from "@/components/admin/menu/modifier-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function NewModifierPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // The form will handle the redirect after successful submission
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/menu/modifiers" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Modifiers
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-2">Add New Modifier</h1>
          <p className="text-muted-foreground">
            Create a new modifier for your menu items
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modifier Details</CardTitle>
          <CardDescription>
            Fill in the details for your new modifier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModifierForm 
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
