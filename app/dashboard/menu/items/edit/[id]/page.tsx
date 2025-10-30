"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MenuItemForm } from "@/components/admin/menu/menu-item-form"
import { MenuItem } from "@/lib/menu-api"
import { menuItemApi } from "@/lib/menu-api"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/hooks/use-user"
import PermissionGate from "@/components/auth/permission-gate"

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, isAdmin, loading: isUserLoading } = useUser()
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
console.log(user?.branch?.branch,"user")
  // Helper function to get branch ID from different possible structures
 const getBranchId = (branch: any): string | null => {
  if (!branch) return null;
  
  // If branch is a string, it could be either ID or name
  if (typeof branch === 'string') {
    // If it's a valid UUID, return it as is
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(branch)) {
      return branch;
    }
    // Otherwise, it's a name - we'll need to find the branch by name
    return null;
  }
  
  // If branch is an object with an id, return the id
  if (branch.id) return branch.id;
  
  return null;
};
 useEffect(() => {
  const fetchMenuItem = async () => {
    if (isUserLoading) return;
    
    try {
      const response = await menuItemApi.getItem(params.id);
      const item = response.data.data;
      
      if (!item) {
        throw new Error("Menu item not found");
      }
      
      // For admins, just set the item and return
      if (isAdmin) {
        setMenuItem(item);
        setIsLoading(false);
        return;
      }
      
      console.log('Current user:', {
        role: user?.role,
        branch: user?.branch,
        permissions: user?.permissions
      });

      // For managers, check branch access
      if (user?.role === 'MANAGER') {
        // Get branch IDs for comparison
        const userBranchId = user.branch?.branch?.id || user.branch;
        const itemBranchId = item.branch?.id || item.branchId;
        
       // Update the branch check logic
console.log('Branch check:', {
  userBranchId,
  itemBranchId,
  userBranch: user.branch,
  itemBranch: item.branch
});

// If the item has no branch, allow access
if (!itemBranchId) {
  console.log('Item has no branch - allowing access');
  setMenuItem(item);
} 
// Check if user's branch ID matches item's branch ID
else if (userBranchId === itemBranchId) {
  console.log('Branch ID matches - allowing access');
  setMenuItem(item);
} 
// Check if user's branch name matches item's branch name
else if (userBranchId === item.branch?.name) {
  console.log('Branch name matches - allowing access');
  setMenuItem(item);
} 
// Check if user's branch ID matches item's branch name (unlikely but just in case)
else if (userBranchId === item.branch?.id) {
  console.log('User branch ID matches item branch ID - allowing access');
  setMenuItem(item);
} 

// Check if user's branch name is in the item's branch object
else if (user.branch?.branch?.name === item.branch?.name) {
  console.log('Branch names match - allowing access');
  setMenuItem(item);
} 
else {
  console.log('Access denied - branch mismatch', {
    userBranchId,
    itemBranchId,
    userBranchName: user.branch?.name,
    itemBranchName: item.branch?.name
  });
  setAccessDenied(true);
  toast({
    title: "Access Denied",
    description: "You don't have permission to edit this menu item.",
    variant: "destructive",
  });
}
      }
    } catch (error) {
      console.error("Failed to fetch menu item:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load menu item data.",
        variant: "destructive",
      });
      setAccessDenied(true);
    } finally {
      setIsLoading(false);
    }
  };

  fetchMenuItem();
}, [params.id, router, isAdmin, user, isUserLoading]);
console.log(menuItem,"menuItem")
  const handleSubmit = async (data: any) => {
    try {
      // Prevent default form submission
      if (typeof window !== 'undefined') {
        const form = document.querySelector('form');
        if (form) {
          form.addEventListener('submit', (e) => e.preventDefault());
        }
      }
      
      await menuItemApi.updateItem(params.id, data);
      toast({
        title: "Success",
        description: "Menu item updated successfully.",
      });
      // Use a small timeout to ensure the toast is visible before redirecting
      setTimeout(() => {
        router.push("/dashboard/menu/items");
        router.refresh(); // Ensure the page is refreshed to show updated data
      }, 500);
    } catch (error) {
      console.error("Failed to update menu item:", error);
      toast({
        title: "Error",
        description: "Failed to update menu item. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to let the form handle the error state
    }
  }

  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] flex-col gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading menu item...</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-center">
          <h3 className="font-medium">Access Denied</h3>
          <p className="text-sm">You don't have permission to access this menu item.</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/dashboard/menu/items')}
          >
            Back to Menu Items
          </Button>
        </div>
      </div>
    )
  }

  if (!menuItem) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-md bg-muted p-4 text-center">
          <p>Menu item not found</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/dashboard/menu/items')}
          >
            Back to Menu Items
          </Button>
        </div>
      </div>
    )
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

      <PermissionGate required="MENU_UPDATE">
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
      </PermissionGate>
    </div>
  )
}
