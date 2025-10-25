"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useForm } from "react-hook-form"
import { inventoryCategoryApi, inventorySubcategoryApi } from "../../../../lib/inventory-api"
import { InventoryCategory, InventorySubcategory } from "@/types/inventory"
import { restaurantApi } from "@/lib/restaurant-api"
import { useUser } from "@/hooks/use-user"

interface CategoryFormData {
  name: string
  description: string
  color: string
  restaurantId: string
}

interface SubcategoryFormData {
  name: string
  description: string
  categoryId: string
  restaurantId: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<{ categoryId: string; subcategory: InventorySubcategory } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialog open states
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [editCategoryOpen, setEditCategoryOpen] = useState(false)
  const [addSubcategoryOpen, setAddSubcategoryOpen] = useState<string | null>(null)
  const [editSubcategoryOpen, setEditSubcategoryOpen] = useState<string | null>(null)

  // Restaurant state
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([])

  const { user, isAdmin } = useUser()
  const categoryForm = useForm<CategoryFormData>()
  const subcategoryForm = useForm<SubcategoryFormData>()

  const fetchCategories = async () => {
    try {
      const response = await inventoryCategoryApi.getCategories()
      console.log(response,"response")
      if (response.status===200) {
        console.log(response.data,"data")
        setCategories(response.data.data || [])
      }
    } catch (err) {
      setError('Failed to fetch categories')
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

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

  // Watch form values for restaurant selection
  const selectedRestaurantId = categoryForm.watch("restaurantId")
  const selectedSubcategoryRestaurantId = subcategoryForm.watch("restaurantId")

  console.log(categories,"categories")

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleAddCategory = async (data: CategoryFormData) => {
    try {
      console.log('Creating category with data:', data)
      const submitData = {
        name: data.name,
        description: data.description,
        color: data.color,
        restaurantId: data.restaurantId,
        isActive: true
      }
      const response = await inventoryCategoryApi.createCategory(submitData)
      if (response.data.success) {
        await fetchCategories()
        categoryForm.reset()
        setAddCategoryOpen(false) // Close the modal
      }
    } catch (err: any) {
      console.error('Error creating category:', err)
      alert(err.response?.data?.message || 'Failed to create category')
    }
  }

  const handleEditCategory = async (data: CategoryFormData) => {
    if (!editingCategory) return

    try {
      console.log('Updating category with data:', data)
      const submitData = {
        name: data.name,
        description: data.description,
        color: data.color,
        restaurantId: data.restaurantId,
        isActive: true
      }
      const response = await inventoryCategoryApi.updateCategory(editingCategory.id, submitData)
      if (response.data.success) {
        await fetchCategories()
        setEditingCategory(null)
        categoryForm.reset()
        setEditCategoryOpen(false) // Close the modal
      }
    } catch (err: any) {
      console.error('Error updating category:', err)
      alert(err.response?.data?.message || 'Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (confirm("Are you sure you want to delete this category? This will remove all subcategories.")) {
      try {
        await inventoryCategoryApi.deleteCategory(categoryId)
        await fetchCategories()
      } catch (err: any) {
        console.error('Error deleting category:', err)
        alert(err.response?.data?.message || 'Failed to delete category')
      }
    }
  }

  const handleAddSubcategory = async (categoryId: string, data: SubcategoryFormData) => {
    try {
      console.log('Creating subcategory with data:', data)
      const submitData = {
        name: data.name,
        description: data.description,
        categoryId: categoryId,
        restaurantId: data.restaurantId,
        isActive: true
      }
      const response = await inventorySubcategoryApi.createSubcategory(submitData)
      if (response.data.success) {
        await fetchCategories()
        subcategoryForm.reset()
        setAddSubcategoryOpen(null) // Close the modal
      }
    } catch (err: any) {
      console.error('Error creating subcategory:', err)
      alert(err.response?.data?.message || 'Failed to create subcategory')
    }
  }

  const handleEditSubcategory = async (data: SubcategoryFormData) => {
    if (!editingSubcategory) return

    try {
      console.log('Updating subcategory with data:', data)
      const submitData = {
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        restaurantId: data.restaurantId,
        isActive: true
      }
      const response = await inventorySubcategoryApi.updateSubcategory(editingSubcategory.subcategory.id, submitData)
      if (response.data.success) {
        await fetchCategories()
        setEditingSubcategory(null)
        subcategoryForm.reset()
        setEditSubcategoryOpen(null) // Close the modal
      }
    } catch (err: any) {
      console.error('Error updating subcategory:', err)
      alert(err.response?.data?.message || 'Failed to update subcategory')
    }
  }

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    if (confirm("Are you sure you want to delete this subcategory?")) {
      try {
        await inventorySubcategoryApi.deleteSubcategory(subcategoryId)
        await fetchCategories()
      } catch (err: any) {
        console.error('Error deleting subcategory:', err)
        alert(err.response?.data?.message || 'Failed to delete subcategory')
      }
    }
  }

  const colorOptions = [
    { value: "bg-red-500", label: "Red" },
    { value: "bg-blue-500", label: "Blue" },
    { value: "bg-green-500", label: "Green" },
    { value: "bg-yellow-500", label: "Yellow" },
    { value: "bg-purple-500", label: "Purple" },
    { value: "bg-pink-500", label: "Pink" },
    { value: "bg-indigo-500", label: "Indigo" },
    { value: "bg-orange-500", label: "Orange" },
    { value: "bg-teal-500", label: "Teal" },
  ]

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading categories...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
          <p className="text-gray-600 mt-2">Organize your inventory with categories and subcategories</p>
        </div>
        
        {/* Add Category Dialog */}
        <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
            </DialogHeader>
            <Form {...categoryForm}>
              <form onSubmit={categoryForm.handleSubmit(handleAddCategory)} className="space-y-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Beverages" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Restaurant Dropdown */}
                <FormField
                  control={categoryForm.control}
                  name="restaurantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select restaurant" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {restaurants
                            .filter(restaurant => restaurant && restaurant.id && typeof restaurant.id === 'string' && restaurant.id.trim() !== "")
                            .map((restaurant) => (
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
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          {colorOptions.map(color => (
                            <option key={color.value} value={color.value}>
                              {color.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Add Category
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {categories.map(category => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <div className={`w-4 h-4 rounded-full ${category.color}`} />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  <Badge variant="secondary">{category.itemCount} items</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  
                  {/* Edit Category Dialog */}
                  <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
                          categoryForm.setValue("name", category.name)
                          categoryForm.setValue("description", category.description || "")
                          categoryForm.setValue("color", category.color)
                          categoryForm.setValue("restaurantId", category.restaurantId || "")
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Category</DialogTitle>
                      </DialogHeader>
                      <Form {...categoryForm}>
                        <form onSubmit={categoryForm.handleSubmit(handleEditCategory)} className="space-y-4">
                          <FormField
                            control={categoryForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={categoryForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={categoryForm.control}
                            name="restaurantId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Restaurant *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select restaurant" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {restaurants
                                      .filter(restaurant => restaurant && restaurant.id && typeof restaurant.id === 'string' && restaurant.id.trim() !== "")
                                      .map((restaurant) => (
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
                            control={categoryForm.control}
                            name="color"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Color</FormLabel>
                                <FormControl>
                                  <select
                                    {...field}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                  >
                                    {colorOptions.map(color => (
                                      <option key={color.value} value={color.value}>
                                        {color.label}
                                      </option>
                                    ))}
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Update Category
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  {/* Add Subcategory Dialog */}
                  <Dialog open={addSubcategoryOpen === category.id} onOpenChange={(open) => setAddSubcategoryOpen(open ? category.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                        Add Subcategory
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Subcategory to {category.name}</DialogTitle>
                      </DialogHeader>
                      <Form {...subcategoryForm}>
                        <form onSubmit={subcategoryForm.handleSubmit((data) => handleAddSubcategory(category.id, data))} className="space-y-4">
                          <FormField
                            control={subcategoryForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subcategory Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., Soft Drinks" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={subcategoryForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Brief description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={subcategoryForm.control}
                            name="restaurantId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Restaurant *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select restaurant" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {restaurants
                                      .filter(restaurant => restaurant && restaurant.id && typeof restaurant.id === 'string' && restaurant.id.trim() !== "")
                                      .map((restaurant) => (
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

                          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                            Add Subcategory
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
              )}
            </CardHeader>

            {expandedCategories.has(category.id) && (
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {category.subcategories.map(subcategory => (
                    <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{subcategory.name}</div>
                        {subcategory.description && (
                          <div className="text-sm text-gray-600">{subcategory.description}</div>
                        )}
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">
                            {subcategory.itemCount} items
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        
                        {/* Edit Subcategory Dialog */}
                        <Dialog open={editSubcategoryOpen === subcategory.id} onOpenChange={(open) => setEditSubcategoryOpen(open ? subcategory.id : null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingSubcategory({ categoryId: category.id, subcategory })
                                subcategoryForm.setValue("name", subcategory.name)
                                subcategoryForm.setValue("description", subcategory.description || "")
                                subcategoryForm.setValue("categoryId", category.id)
                                subcategoryForm.setValue("restaurantId", subcategory.restaurantId || "")
                              }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Subcategory</DialogTitle>
                            </DialogHeader>
                            <Form {...subcategoryForm}>
                              <form onSubmit={subcategoryForm.handleSubmit(handleEditSubcategory)} className="space-y-4">
                                <FormField
                                  control={subcategoryForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Subcategory Name</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={subcategoryForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description</FormLabel>
                                      <FormControl>
                                        <Input {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={subcategoryForm.control}
                                  name="restaurantId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Restaurant *</FormLabel>
                                      <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select restaurant" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {restaurants
                                            .filter(restaurant => restaurant && restaurant.id && typeof restaurant.id === 'string' && restaurant.id.trim() !== "")
                                            .map((restaurant) => (
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

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                  Update Subcategory
                                </Button>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {category.subcategories.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No subcategories yet. Add one to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}