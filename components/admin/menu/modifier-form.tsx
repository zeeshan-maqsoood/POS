"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import {
  Loader2,
  Save,
  X,
  Trash2,
  ChefHat,
  ChevronDown,
} from "lucide-react"
import { Modifier, modifierApi } from "@/lib/menu-api"
import { inventoryItemApi } from "@/lib/inventory-api"
import { branchApi } from "@/lib/branch-api"
import { restaurantApi } from "@/lib/restaurant-api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { v4 as uuidv4 } from "uuid"
import { useUser } from "@/hooks/use-user"

const units = ["kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"]

// Validation schemas
const modifierIngredientSchema = z.object({
  id: z.string().default(() => uuidv4()),
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  currentStock: z.number().optional(),
})

const modifierFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  type: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  minSelection: z.coerce.number().min(0).default(0),
  maxSelection: z.coerce.number().min(1).default(1),
  restaurantId: z.string().optional(),
  branchId: z.string().optional(),
  ingredients: z.array(modifierIngredientSchema).default([]),
})

type ModifierFormValues = z.infer<typeof modifierFormSchema>

interface ModifierFormProps {
  initialData?: Modifier
  onSuccess?: () => void
  onCancel?: () => void
}

// Helper to safely extract branch ID from various formats
const getBranchId = (branch: any): string => {
  console.log(branch,"branch")
  if (!branch) return ""
  if (typeof branch === "string") return branch
  if (branch && typeof branch === "object") {
    if ('id' in branch) return branch.id
    if ('_id' in branch) return branch._id
  }
  return ""
}

// Type guards for branch and restaurant
const isBranchObject = (branch: any): branch is { id: string; name: string;[key: string]: any } => {
  return branch && typeof branch === 'object' && 'id' in branch && 'name' in branch;
};

const isRestaurantObject = (restaurant: any): restaurant is { id: string; name: string;[key: string]: any } => {
  return restaurant && typeof restaurant === 'object' && 'id' in restaurant && 'name' in restaurant;
};

// Define a more flexible user type
type User = {
  id?: string;
  _id?: string;
  email?: string;
  name?: string;
  role?: string;
  branch?: string | { id: string; name: string;[key: string]: any } | null;
  restaurant?: string | { id: string; name: string;[key: string]: any } | null;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

// Helper function to safely get user info for logging
const getUserInfoForLogging = (user: User | null) => {
  if (!user) return 'No user';

  const safeGetBranchName = (branch: any): string => {
    if (!branch) return 'None';
    if (typeof branch === 'string') return branch;
    return branch.name || 'Unnamed Branch';
  };

  const safeGetRestaurantName = (restaurant: any): string => {
    if (!restaurant) return 'None';
    if (typeof restaurant === 'string') return restaurant;
    return restaurant.name || 'Unnamed Restaurant';
  };

  return {
    id: user.id || user._id || 'unknown',
    name: typeof user.name === 'string' ? user.name : 'unknown',
    role: typeof user.role === 'string' ? user.role : 'unknown',
    branch: safeGetBranchName(user.branch),
    restaurant: safeGetRestaurantName(user.restaurant)
  };
};

export function ModifierForm({ initialData, onSuccess, onCancel }: ModifierFormProps) {
  const { user } = useUser() as { user: User | null }
  const isAdmin = user?.role === "ADMIN"
  const router = useRouter()

  // Helper to safely get branch ID from user
  const getUserBranchId = (): string => {
   return user?.branch?.branch?.id
  }

  // Helper to safely get restaurant ID from user
  const getUserRestaurantId = (): string => {
    if (!user?.restaurant) return ""
    if (typeof user.restaurant === 'string') return user.restaurant
    if (user.restaurant && 'id' in user.restaurant) return user.restaurant.id
    if (user.restaurant && '_id' in user.restaurant) return user.restaurant._id
    return ""
  }

  const [isLoading, setIsLoading] = React.useState(false)

  // Log user info safely for debugging
  React.useEffect(() => {
    if (user) {
      console.log('Current user:', getUserInfoForLogging(user));
    }
  }, [user]);

  const [inventoryItems, setInventoryItems] = React.useState<
    { id: string; name: string; quantity: number; unit: string }[]
  >([])
  const [restaurants, setRestaurants] = React.useState<any[]>([])
  const [branches, setBranches] = React.useState<any[]>([])
  const [isIngredientDropdownOpen, setIsIngredientDropdownOpen] = React.useState(false)
  const [ingredientSearchTerm, setIngredientSearchTerm] = React.useState("")

  const form = useForm<ModifierFormValues>({
    resolver: zodResolver(modifierFormSchema),
    mode: 'onChange', // Enable validation on change
    defaultValues: initialData
      ? {
          ...initialData,
          price: typeof initialData.price === 'number' ? initialData.price : Number(initialData.price || 0),
          minSelection: typeof initialData.minSelection === 'number' ? initialData.minSelection : Number(initialData.minSelection || 0),
          maxSelection: typeof initialData.maxSelection === 'number' ? initialData.maxSelection : Number(initialData.maxSelection || 1),
          restaurantId: initialData.restaurantId || (user?.restaurant?.id || ''),
          branchId: initialData.branchId || (getBranchId(user?.branch) || ''),
          type: initialData.type || "SINGLE",
          ingredients: initialData.modifierIngredients?.map((ing: any) => ({
            id: ing.id,
            inventoryItemId: ing.inventoryItemId,
            name: ing.inventoryItem?.name || "Unknown",
            quantity: ing.quantity,
            unit: ing.unit || "units",
          })) || [],
        }
      : {
          name: "",
          description: "",
          price: 0,
          isRequired: false,
          isActive: true,
          type: "SINGLE" as const,
          minSelection: 0,
          maxSelection: 1,
          restaurantId: isAdmin ? "" : (getUserRestaurantId() || ""),
          branchId: isAdmin ? "" : (getUserBranchId() || ""),
          ingredients: [],
        },
  })

  const { fields: ingredientFields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  })

  // --- Fetch data ---
  React.useEffect(() => {
    const loadInventory = async () => {
      try {
        const res = await inventoryItemApi.getItems()
        const data = Array.isArray(res?.data?.data) ? res.data.data : []
        setInventoryItems(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity || 0,
            unit: item.unit || "pieces",
          }))
        )
      } catch (e) {
        console.error("Error loading inventory items:", e)
      }
    }
    loadInventory()
  }, [])

  React.useEffect(() => {
    if (isAdmin) {
      const loadRestaurants = async () => {
        try {
          const res = await restaurantApi.getActiveRestaurants()
          setRestaurants(Array.isArray(res?.data?.data) ? res.data.data : [])
        } catch (e) {
          console.error("Error loading restaurants:", e)
        }
      }
      loadRestaurants()
    }
  }, [isAdmin])

  React.useEffect(() => {
    if (!user || isAdmin || initialData) return

    const setup = async () => {
      try {
        // ✅ Restaurant
        if (user.restaurant?.id) {
          form.setValue("restaurantId", user.restaurant.id)
          form.setValue("restaurantName", user.restaurant.name || "")
        }

        // ✅ Branch
        if (user.branch) {
          const branchId = getUserBranchId()
          console.log(branchId,"branchId")
          const branchName = typeof user.branch === "object" ? user.branch.name : ""
          if (branchId) {
            form.setValue("branchId", branchId)
            form.setValue("branchName", branchName)
            return
          }
        }

        // ✅ Fallback: get branches manually if not attached in user object
        const response = await branchApi.getUserBranches()
        const userBranches = Array.isArray(response?.data?.data) ? response.data.data : []
        if (userBranches.length > 0) {
          const managerBranch = userBranches[0]
          form.setValue("branchId", managerBranch.id)
          form.setValue("branchName", managerBranch.name || "")
          if (managerBranch.restaurant) {
            form.setValue("restaurantId", managerBranch.restaurant.id)
            form.setValue("restaurantName", managerBranch.restaurant.name || "")
          }
        }
      } catch (err) {
        console.error("Error setting up manager data:", err)
      }
    }

    setup()
  }, [
    user?.id,                // wait until user exists
    user?.branch,            // run again when branch loads
    user?.restaurant,        // run again when restaurant loads
    isAdmin,
    initialData,
    form,
  ])

  const selectedRestaurantId = form.watch("restaurantId")

  React.useEffect(() => {
    if (!isAdmin) return
    const loadBranches = async () => {
      if (!selectedRestaurantId) {
        setBranches([])
        return
      }
      try {
        const res = await restaurantApi.getRestaurantById(selectedRestaurantId)
        const data = res?.data?.data
        setBranches(
          data?.branches?.filter((b: any) => b.isActive) ?? []
        )
      } catch (e) {
        console.error("Error loading branches:", e)
      }
    }
    loadBranches()
  }, [selectedRestaurantId, isAdmin])

  // Ingredient handlers
  const { isSubmitting, isValid, errors } = form.formState;
  
  // Log form errors for debugging
  React.useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
    }
  }, [errors]);

  const selectedIngredients = form.watch("ingredients") || []
  const filteredInventoryItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) &&
      !selectedIngredients.some((sel) => sel.inventoryItemId === item.id)
  )

  const handleAddIngredient = (item: any) => {
    append({
      inventoryItemId: item.id,
      name: item.name,
      quantity: 1,
      unit: item.unit,
      currentStock: item.quantity,
    })
    setIngredientSearchTerm("")
    setIsIngredientDropdownOpen(false)
  }

  // --- Submit ---
  const onSubmit = async (data: ModifierFormValues) => {
    try {
      setIsLoading(true);
      // Remove restaurantName and branchName as they're not part of the database model
      const { ingredients, restaurantId, branchId, restaurantName, branchName, ...rest } = data;

      // Prepare the data to be sent to the API
      const formatted: any = {
        ...rest,
        price: Number(data.price),
        minSelection: Number(data.minSelection),
        maxSelection: Number(data.maxSelection),
        type: data.type || 'SINGLE',
      };
      
      // Clean up the data object before sending
      Object.keys(formatted).forEach(key => {
        // Remove any undefined, null, or empty string values
        if (formatted[key] === undefined || formatted[key] === null || formatted[key] === '') {
          delete formatted[key];
        }
        // Ensure we're not sending any non-database fields
        if (['restaurantName', 'branchName'].includes(key)) {
          delete formatted[key];
        }
      });

      // Handle branch and restaurant assignment based on user role
      if (isAdmin) {
        // For admins, use the selected branch/restaurant or null for global
        formatted.branchId = branchId === "global" ? null : branchId;
        formatted.restaurantId = restaurantId === "global" ? null : restaurantId;
      } else {
        // For managers, use their assigned branch and restaurant
        const userBranchId = getUserBranchId();
        const userRestaurantId = getUserRestaurantId();

        if (userBranchId) {
          formatted.branchId = userBranchId;
        }

        if (userRestaurantId) {
          formatted.restaurantId = userRestaurantId;
        }
      }

      // Add ingredients if any
      if (ingredients?.length) {
        formatted.modifierIngredients = {
          create: ingredients.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            quantity: i.quantity,
            unit: i.unit,
          })),
        };
      }

      console.log('Submitting modifier with data:', {
        ...formatted,
        isAdmin,
        userBranch: user?.branch,
        formBranchId: branchId,
        finalBranchId: formatted.branchId
      });

      if (initialData) {
        await modifierApi.updateModifier(initialData.id, formatted)
        toast({ title: "Success", description: "Modifier updated successfully." })
      } else {
        await modifierApi.createModifier(formatted)
        toast({ title: "Success", description: "Modifier created successfully." })
      }

      onSuccess?.()
      router.refresh()
      router.push("/dashboard/menu/modifiers")
    } catch (e) {
      console.error("Error saving modifier:", e)
      toast({
        title: "Error",
        description: "Failed to save modifier. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Basic info */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Extra Cheese" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Description" {...field} className="resize-none" />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Restaurant / Branch selection */}
              {isAdmin ? (
                <>
                  <FormField
                    control={form.control}
                    name="restaurantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select restaurant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {restaurants.map((r) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="branchId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedRestaurantId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="global">🌐 Global (All Branches)</SelectItem>
                            {branches.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <div>
                    <FormLabel>Restaurant</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {typeof user?.restaurant === 'object' && user.restaurant.name
                        ? user.restaurant.name
                        : user?.restaurant || "Not assigned"}
                    </div>
                  </div>
                  <div>
                    <FormLabel>Branch</FormLabel>
                    <div className="p-2 border rounded-md bg-gray-50">
                      {isBranchObject(user?.branch)
                        ? user.branch.name
                        : (typeof user?.branch === 'string' ? user.branch : "Not assigned")}
                    </div>
                  </div>
                </>
              )}

              <FormField
                control={form.control}
                name="isRequired"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                    <div>
                      <FormLabel>Required</FormLabel>
                      <FormDescription>Is this modifier required?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Modifier availability</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Right: Ingredients */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ChefHat className="w-5 h-5" /> Ingredients
              </h3>

              {ingredientFields.map((field, index) => (
                <div key={field.id} className="flex justify-between items-center border p-3 rounded-md">
                  <div className="flex-1">
                    <p className="font-medium">{field.name}</p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={field.quantity}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          const current = form.getValues("ingredients")
                          current[index].quantity = value
                          form.setValue("ingredients", current)
                        }}
                        className="w-20 h-8"
                      />
                      <Select
                        value={field.unit}
                        onValueChange={(val) => {
                          const current = form.getValues("ingredients")
                          current[index].unit = val
                          form.setValue("ingredients", current)
                        }}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        Stock: {field.currentStock} {field.unit}
                      </span>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {/* Add ingredient dropdown */}
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsIngredientDropdownOpen(!isIngredientDropdownOpen)}
                >
                  Add Ingredient
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${isIngredientDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </Button>

                {isIngredientDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 border bg-popover rounded-md shadow-md">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search ingredients..."
                        value={ingredientSearchTerm}
                        onChange={(e) => setIngredientSearchTerm(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {filteredInventoryItems.length > 0 ? (
                        filteredInventoryItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleAddIngredient(item)}
                            className="p-2 hover:bg-accent cursor-pointer"
                          >
                            <span>{item.name}</span>
                            <p className="text-sm text-muted-foreground">
                              Available: {item.quantity} {item.unit}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No ingredients found
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.push("/dashboard/menu/modifiers"))}
              disabled={isLoading}
            >
              <X className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !isValid}
              title={!isValid ? 'Please fill in all required fields' : 'Save modifier'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Modifier
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}