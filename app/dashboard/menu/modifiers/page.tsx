"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ModifiersTable } from "@/components/admin/menu/modifiers-table"
import { Modifier, modifierApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"
import PermissionGate from "@/components/auth/permission-gate"
// This component is a client component that will be rendered inside the dashboard layout
export default function ModifiersPage() {
  const [modifiers, setModifiers] = useState<Modifier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchModifiers = async () => {
    try {
      setIsLoading(true)
      const response = await modifierApi.getModifiers({
        status: 'all'
      })
      setModifiers(response.data.data)
      setError(null)
    } catch (err) {
      console.error("Failed to fetch modifiers:", err)
      setError("Failed to load modifiers. Please try again later.")
      toast({
        title: "Error",
        description: "Failed to load modifiers.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchModifiers()
  }, [])

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      await modifierApi.deleteModifier(id);
      
      // Optimistically update the UI
      setModifiers(prevModifiers => prevModifiers.filter(modifier => modifier.id !== id));
      
      toast({
        title: "Success",
        description: "Modifier deleted successfully.",
      });
    } catch (error: unknown) {
      console.error("Failed to delete modifier:", error);
      
      // Re-fetch to ensure UI is in sync with server
      fetchModifiers();
      
      const errorMessage = error && typeof error === 'object' && 'response' in error && 
                         typeof error.response === 'object' && error.response !== null &&
                         'data' in error.response && error.response.data &&
                         typeof error.response.data === 'object' && 'message' in error.response.data
                        ? String(error.response.data.message)
                        : "Failed to delete modifier. Make sure no menu items are using it.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      await modifierApi.toggleModifierStatus(id, isActive);
      
      // Update the local state to reflect the change immediately
      setModifiers(prevModifiers => 
        prevModifiers.map(modifier => 
          modifier.id === id 
            ? { ...modifier, isActive: !isActive } 
            : modifier
        )
      );
      
      toast({
        title: "Success",
        description: `Modifier marked as ${!isActive ? 'active' : 'inactive'}.`,
      });
    } catch (error) {
      console.error("Failed to update modifier status:", error);
      toast({
        title: "Error",
        description: "Failed to update modifier status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Modifiers</h1>
          <p className="text-muted-foreground">
            Manage modifiers that can be added to menu items
          </p>
        </div>
        <PermissionGate required="MENU_CREATE">
        <Button asChild>
          <Link href="/dashboard/menu/modifiers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Modifier
          </Link>
        </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Modifiers</CardTitle>
              <CardDescription>
                View and manage your menu modifiers and options
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
                onClick={fetchModifiers}
              >
                Retry
              </Button>
            </div>
          ) : (
            <ModifiersTable 
              data={modifiers} 
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onEdit={(id) => window.location.href = `/dashboard/menu/modifiers/${id}`}
              isLoading={isDeleting ? true : isLoading}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
