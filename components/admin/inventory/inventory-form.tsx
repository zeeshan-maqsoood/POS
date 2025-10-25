"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { InventoryCategory, InventoryItem, InventorySubcategory, Supplier } from "@/types/inventory"
import { useUser } from "@/hooks/use-user"
import { inventoryCategoryApi, inventorySubcategoryApi, inventoryItemApi } from "@/lib/inventory-api"
import restaurantApi from "@/lib/restaurant-api"


const units = ["kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"]
const locations = ["Walk-in Fridge", "Freezer", "Dry Storage", "Pantry", "Wine Cellar", "Prep Station"]

interface InventoryFormData {
    name: string
    description?: string
    categoryId: string
    subcategoryId?: string
    quantity: number
    unit: string
    cost: number
    minStock: number
    maxStock: number
    supplier: string
    location: string
    status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
    expiryDate?: string
    restaurantId: string
}

interface InventoryFormProps {
    initialData?: InventoryItem
    isEdit?: boolean
    onSuccess?: () => void
}

export function InventoryForm({ initialData, isEdit = false, onSuccess }: InventoryFormProps) {
    const router = useRouter()
    const [categories, setCategories] = useState<InventoryCategory[]>([])
    const [subcategories, setSubcategories] = useState<InventorySubcategory[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([])
    const [loading, setLoading] = useState(false)
    const { user, isAdmin } = useUser()

    const form = useForm<InventoryFormData>({
        defaultValues: initialData ? {
            name: initialData.name,
            description: initialData.description || "",
            categoryId: initialData.categoryId,
            subcategoryId: initialData.subcategoryId || undefined,
            quantity: initialData.quantity,
            unit: initialData.unit,
            cost: initialData.cost,
            minStock: initialData.minStock,
            maxStock: initialData.maxStock,
            supplier: initialData.supplier,
            location: initialData.location,
            status: initialData.status,
            expiryDate: initialData.expiryDate?.split('T')[0] || "",
            restaurantId: initialData.restaurantId || "",
        } : {
            name: "",
            description: "",
            categoryId: "",
            subcategoryId: undefined,
            quantity: 0,
            unit: "kg",
            cost: 0,
            minStock: 1,
            maxStock: 100,
            supplier: "",
            location: "Dry Storage",
            status: "IN_STOCK",
            expiryDate: "",
            restaurantId: "",
        }
    })

    // Watch form values
    const selectedRestaurantId = form.watch("restaurantId")
    const selectedCategoryId = form.watch("categoryId")

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await inventoryCategoryApi.getCategories({
                    ...(isAdmin && selectedRestaurantId ? { restaurantId: selectedRestaurantId } : {})
                })
                if (response.data.success) {
                    setCategories(response.data.data)
                }
            } catch (err) {
                console.error('Error fetching categories:', err)
            }
        }
        fetchCategories()
    }, [selectedRestaurantId, isAdmin])

    // Fetch restaurants on component mount
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await restaurantApi.getRestaurantsForDropdown()
                if (response?.data?.data) {
                    setRestaurants(response.data.data)
                }
            } catch (err) {
                console.error('Error fetching restaurants:', err)
            }
        }
        fetchRestaurants()
    }, [])

    // Fetch subcategories when category changes
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (!selectedCategoryId) {
                setSubcategories([])
                form.setValue("subcategoryId", undefined)
                return
            }

            try {
                const response = await inventorySubcategoryApi.getSubcategories({
                    categoryId: selectedCategoryId
                })
                if (response.data.success) {
                    setSubcategories(response.data.data)
                }
            } catch (err) {
                console.error('Error fetching subcategories:', err)
                setSubcategories([])
            }
        }
        fetchSubcategories()
    }, [selectedCategoryId, form])

    const onSubmit = async (data: InventoryFormData) => {
        setLoading(true)
      // Validate required fields
      if (!data.name || data.name.trim().length < 2) {
        toast({
          title: "Error",
          description: "Item name must be at least 2 characters long.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // For admins, validate restaurant selection
      if (isAdmin) {
        if (!data.restaurantId || data.restaurantId.trim() === "") {
          toast({
            title: "Error",
            description: "Please select a restaurant.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      console.log('Form validation passed, proceeding with submission');

      try {
        console.log('Creating inventory item with data:', data)

        // Prepare the data for API - fix the issues
        const submitData: any = {
          name: data.name,
          description: data.description,
          categoryId: data.categoryId,
          quantity: data.quantity,
          unit: data.unit,
          cost: data.cost,
          minStock: data.minStock,
          maxStock: data.maxStock,
          supplier: data.supplier,
          location: data.location,
          status: data.status,
          restaurantId: data.restaurantId,
        }

            // Handle subcategoryId - only include if it exists and is not "no-subcategory"
            if (data.subcategoryId && data.subcategoryId !== "no-subcategory") {
                submitData.subcategoryId = data.subcategoryId
            }

            // Handle expiryDate - convert to proper DateTime format or omit if empty
            if (data.expiryDate) {
                // Convert to ISO string for Prisma
                submitData.expiryDate = new Date(data.expiryDate + 'T00:00:00.000Z').toISOString()
            }

            console.log('Sending to API:', submitData)

            if (isEdit && initialData) {
                await inventoryItemApi.updateItem(initialData.id, submitData)
            } else {
                await inventoryItemApi.createItem(submitData)
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/dashboard/Inventory')
            }
        } catch (err: any) {
            console.error('Error saving inventory item:', err)
            alert(err.response?.data?.message || 'Failed to save inventory item')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">
                    {isEdit ? "Edit Inventory Item" : "Add New Inventory Item"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Item Name *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Chicken Breast, Tomatoes, Olive Oil"
                                                    {...field}
                                                    className="border-gray-300 focus:border-blue-500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Restaurant Dropdown */}
                                <FormField
                                    control={form.control}
                                    name="restaurantId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Restaurant *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                        <SelectValue placeholder="Select restaurant" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {restaurants.map((restaurant) => (
                                                        <SelectItem key={restaurant.id} value={restaurant.id}>
                                                            {restaurant.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="categoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Category *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            <div className="flex items-center">
                                                                <div className={`w-3 h-3 rounded-full mr-2 ${category.color}`} />
                                                                {category.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="subcategoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Subcategory</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                value={field.value || "no-subcategory"}
                                                disabled={!selectedCategoryId}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                        <SelectValue placeholder={
                                                            selectedCategoryId ? "Select subcategory" : "Select category first"
                                                        } />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="no-subcategory">No Subcategory</SelectItem>
                                                    {subcategories.map((subcategory) => (
                                                        <SelectItem key={subcategory.id} value={subcategory.id}>
                                                            {subcategory.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="supplier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Supplier</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Supplier name"
                                                    {...field}
                                                    className="border-gray-300 focus:border-blue-500"
                                                />
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
                                            <FormLabel className="text-gray-700 font-medium">Description</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Item description"
                                                    {...field}
                                                    className="border-gray-300 focus:border-blue-500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Stock Information */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Stock Information</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">Current Qty</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="border-gray-300 focus:border-blue-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="unit"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">Unit</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {units.map((unit) => (
                                                            <SelectItem key={unit} value={unit}>
                                                                {unit}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="minStock"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">Min Stock</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="border-gray-300 focus:border-blue-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="maxStock"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-gray-700 font-medium">Max Stock</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        {...field}
                                                        onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                        className="border-gray-300 focus:border-blue-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Storage Location</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                        <SelectValue placeholder="Select location" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {locations.map((location) => (
                                                        <SelectItem key={location} value={location}>
                                                            {location}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Pricing & Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Pricing</h3>

                                <FormField
                                    control={form.control}
                                    name="cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Cost Price</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="0.00"
                                                    {...field}
                                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                                                    className="border-gray-300 focus:border-blue-500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Additional Info</h3>

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Status</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
                                                        <SelectValue placeholder="Select status" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="IN_STOCK">In Stock</SelectItem>
                                                    <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                                                    <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-gray-700 font-medium">Expiry Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                    className="border-gray-300 focus:border-blue-500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6 border-t border-gray-200">
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : (isEdit ? "Update Item" : "Add to Inventory")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/inventory')}
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}