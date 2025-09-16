"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ModifierForm } from "@/components/admin/menu/modifier-form"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Modifier, modifierApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"

export default function EditModifierPage() {
  const params = useParams()
  const router = useRouter()
  const [modifier, setModifier] = useState<Modifier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const modifierId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    const fetchModifier = async () => {
      try {
        setIsLoading(true)
        const response = await modifierApi.getModifier(modifierId)
        setModifier(response.data.data)
        setError(null)
      } catch (err) {
        console.error("Failed to fetch modifier:", err)
        setError("Failed to load modifier. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load modifier.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (modifierId) {
      fetchModifier()
    }
  }, [modifierId])

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
        <span className="ml-2 text-muted-foreground">Loading modifier...</span>
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

  if (!modifier) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md bg-muted p-4 text-center">
          <p>Modifier not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/dashboard/menu/modifiers">
              Back to Modifiers
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
            <Link href="/dashboard/menu/modifiers" className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Modifiers
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-2">Edit Modifier</h1>
          <p className="text-muted-foreground">
            Update the details of this modifier
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{modifier.name}</CardTitle>
          <CardDescription>
            Update the details for this modifier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModifierForm 
            initialData={modifier}
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
