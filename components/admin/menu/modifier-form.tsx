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
import { Loader2, Save, X, Plus, Trash2, ChefHat, ChevronDown, ChevronUp } from "lucide-react"
import { Modifier, modifierApi } from "@/lib/menu-api"
import { inventoryItemApi } from "@/lib/inventory-api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { v4 as uuidv4 } from 'uuid'

const units = ["kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"]

const modifierIngredientSchema = z.object({
  id: z.string().default(() => uuidv4()),
  inventoryItemId: z.string().min(1, "Inventory item is required"),
  name: z.string().min(1, "Name is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  currentStock: z.number().optional(),
})

const modifierFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
  type: z.enum(["SINGLE", "MULTIPLE"]).default("SINGLE"),
  minSelection: z.coerce.number().min(0).default(0),
  maxSelection: z.coerce.number().min(1).default(1),
  ingredients: z.array(modifierIngredientSchema).default([]),
})

type ModifierFormValues = z.infer<typeof modifierFormSchema>

interface ModifierFormProps {
  initialData?: Modifier
  onSuccess?: () => void
  onCancel?: () => void
}

export function ModifierForm({ initialData, onSuccess, onCancel }: ModifierFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [inventoryItems, setInventoryItems] = React.useState<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[]>([])
  const [isIngredientDropdownOpen, setIsIngredientDropdownOpen] = React.useState(false)
  const [ingredientSearchTerm, setIngredientSearchTerm] = React.useState("")
  const router = useRouter()

  const form = useForm<ModifierFormValues>({
    resolver: zodResolver(modifierFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      isRequired: initialData?.isRequired || false,
      isActive: initialData?.isActive ?? true,
      type: initialData?.type || "SINGLE",

      ingredients: initialData?.modifierIngredients?.map(ing => ({
        id: ing.id,
        inventoryItemId: ing.inventoryItemId,
        name: ing.inventoryItem?.name || `Item ${ing.inventoryItemId}`,
        quantity: ing.quantity || 0,
        unit: ing.unit || "pieces",
        currentStock: ing.inventoryItem?.quantity || 0
      })) || [],
    },
  })

  const { fields: ingredientFields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  })

  // Fetch inventory items
  React.useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const inventoryRes = await inventoryItemApi.getItems()
        const inventoryData = Array.isArray(inventoryRes?.data?.data) ? inventoryRes.data.data : []

        setInventoryItems(inventoryData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || "pieces",
        })))
      } catch (error) {
        console.error("Error loading inventory items:", error)
      }
    }

    fetchInventoryItems()
  }, [])

  const selectedIngredients = form.watch("ingredients") || []
  const filteredInventoryItems = inventoryItems.filter(
    item =>
      item.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) &&
      !selectedIngredients.some(selected => selected.inventoryItemId === item.id)
  )

  const handleAddIngredient = (inventoryItem: {
    quantity: number;
    id: string;
    name: string;
    unit: string;
  }) => {
    append({
      inventoryItemId: inventoryItem.id,
      name: inventoryItem.name,
      quantity: 1,
      unit: inventoryItem.unit,
      currentStock: inventoryItem.quantity || 0
    })
    setIngredientSearchTerm("")
    setIsIngredientDropdownOpen(false)
  }

  const handleRemoveIngredient = (index: number) => {
    remove(index)
  }

  const handleIngredientQuantityChange = (index: number, quantity: number) => {
    const currentIngredients = form.getValues("ingredients") || []
    const updatedIngredients = [...currentIngredients]
    updatedIngredients[index] = { ...updatedIngredients[index], quantity }
    form.setValue("ingredients", updatedIngredients)
  }

  const handleIngredientUnitChange = (index: number, unit: string) => {
    const currentIngredients = form.getValues("ingredients") || []
    const updatedIngredients = [...currentIngredients]
    updatedIngredients[index] = { ...updatedIngredients[index], unit }
    form.setValue("ingredients", updatedIngredients)
  }

  const onSubmit = async (data: ModifierFormValues) => {
    try {
      setIsLoading(true)
      const { ingredients, minSelection, maxSelection, ...allData } = data

      const formattedData = {
        ...allData,
        price: Number(allData.price),
        // Format ingredients for the backend
        modifierIngredients: {
          create: ingredients.map(ing => ({
            inventoryItemId: ing.inventoryItemId,
            quantity: ing.quantity,
            unit: ing.unit
          }))
        }
      }

      console.log('Submitting modifier data:', formattedData)

      if (initialData) {
        // Update existing modifier
        await modifierApi.updateModifier(initialData.id, formattedData)
        toast({
          title: "Success",
          description: "Modifier updated successfully.",
        })
      } else {
        // Create new modifier
        await modifierApi.createModifier(formattedData)
        toast({
          title: "Success",
          description: "Modifier created successfully.",
        })
      }

      onSuccess?.()
      router.refresh()
      router.push("/dashboard/menu/modifiers")
    } catch (error) {
      console.error("Error saving modifier:", error)
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
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
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short description of this modifier"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Required</FormLabel>
                    <FormDescription>
                      Is this modifier required when ordering?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      This modifier will be available when active
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Ingredients Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Ingredients
              </h3>
            </div>

            <div className="space-y-2">
              {ingredientFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{field.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={field.quantity}
                        onChange={(e) =>
                          handleIngredientQuantityChange(
                            index,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8"
                      />
                      <Select
                        value={field.unit}
                        onValueChange={(value) =>
                          handleIngredientUnitChange(index, value)
                        }
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        Stock: {field.currentStock} {field.unit}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

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
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search ingredients..."
                        value={ingredientSearchTerm}
                        onChange={(e) => setIngredientSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {filteredInventoryItems.length > 0 ? (
                        filteredInventoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
                            onClick={() => handleAddIngredient(item)}
                          >
                            <div>
                              <span>{item.name}</span>
                              <p className="text-sm text-muted-foreground">
                                Available: {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {ingredientSearchTerm
                            ? "No ingredients found."
                            : "No available ingredients."}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData ? 'Save Changes' : 'Create Modifier'}
          </Button>
        </div>
      </form>
    </Form>
  )
}