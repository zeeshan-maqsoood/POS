"use client"

import { useState, useEffect } from "react"
import { DataTable } from "../data-table"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { restaurantApi, Restaurant, CreateRestaurantData, UpdateRestaurantData } from "@/lib/restaurant-api"
import { toast } from "sonner"

const columns = [
  { key: "name", label: "Restaurant Name", sortable: true },
  { key: "businessType", label: "Type", sortable: true },
  { key: "city", label: "City", sortable: true },
  { key: "state", label: "State", sortable: true },
  { key: "isActive", label: "Status", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
]

export function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null)
  const [newRestaurant, setNewRestaurant] = useState<CreateRestaurantData>({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    businessType: "",
    cuisine: [],
    establishedYear: undefined,
    isActive: true,
  })

  // Load restaurants on component mount
  useEffect(() => {
    loadRestaurants()
  }, [])

  const loadRestaurants = async () => {
    try {
      setLoading(true)
      const response = await restaurantApi.getAllRestaurants()
      setRestaurants(response.data.data)
    } catch (error) {
      console.error('Error loading restaurants:', error)
      toast.error('Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRestaurant = async () => {
    try {
      const response = await restaurantApi.createRestaurant(newRestaurant)
      if (response.data) {
        setRestaurants([...restaurants, response.data.data])
        resetNewRestaurant()
        setIsAddDialogOpen(false)
        toast.success('Restaurant created successfully')
      }
    } catch (error) {
      console.error('Error creating restaurant:', error)
      toast.error('Failed to create restaurant')
    }
  }

  const handleEditRestaurant = async () => {
    if (!editingRestaurant) return

    try {
      const updateData: UpdateRestaurantData = {
        name: newRestaurant.name,
        description: newRestaurant.description,
        address: newRestaurant.address,
        city: newRestaurant.city,
        state: newRestaurant.state,
        postalCode: newRestaurant.postalCode,
        phone: newRestaurant.phone,
        email: newRestaurant.email,
        website: newRestaurant.website,
        businessType: newRestaurant.businessType,
        cuisine: newRestaurant.cuisine,
        establishedYear: newRestaurant.establishedYear,
        isActive: newRestaurant.isActive,
      }

      const response = await restaurantApi.updateRestaurant(editingRestaurant.id, updateData)
      if (response.data) {
        setRestaurants(restaurants.map(restaurant =>
          restaurant.id === editingRestaurant.id ? response.data.data : restaurant
        ))
        setIsEditDialogOpen(false)
        setEditingRestaurant(null)
        resetNewRestaurant()
        toast.success('Restaurant updated successfully')
      }
    } catch (error) {
      console.error('Error updating restaurant:', error)
      toast.error('Failed to update restaurant')
    }
  }

  const handleDeleteRestaurant = async (restaurant: Restaurant) => {
    try {
      await restaurantApi.deleteRestaurant(restaurant.id)

      // Update the restaurant in local state to mark it as inactive instead of removing it
      setRestaurants(restaurants.map(r =>
        r.id === restaurant.id ? { ...r, isActive: false } : r
      ))

      toast.success('Restaurant deactivated successfully')
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error('Failed to delete restaurant')
    }
  }

  const handleViewRestaurant = (restaurant: Restaurant) => {
    console.log("View restaurant:", restaurant)
    // You can implement a view dialog here if needed
  }

  const openEditDialog = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant)
    setNewRestaurant({
      name: restaurant.name,
      description: restaurant.description || "",
      address: restaurant.address || "",
      city: restaurant.city || "",
      state: restaurant.state || "",
      postalCode: restaurant.postalCode || "",
      phone: restaurant.phone || "",
      email: restaurant.email || "",
      website: restaurant.website || "",
      businessType: restaurant.businessType || "",
      cuisine: restaurant.cuisine || [],
      establishedYear: restaurant.establishedYear,
      isActive: restaurant.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const resetNewRestaurant = () => {
    setNewRestaurant({
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      phone: "",
      email: "",
      website: "",
      businessType: "",
      cuisine: [],
      establishedYear: undefined,
      isActive: true,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading restaurants...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Restaurant Management</h2>
          <p className="text-muted-foreground">Manage your restaurant chains and business information</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetNewRestaurant()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Restaurant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Restaurant</DialogTitle>
              <DialogDescription>Create a new restaurant chain.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Restaurant Name
                </Label>
                <Input
                  id="name"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Joe's Restaurant Chain"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="businessType" className="text-right">
                  Business Type
                </Label>
                <Select
                  value={newRestaurant.businessType || ""}
                  onValueChange={(value) => setNewRestaurant({ ...newRestaurant, businessType: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAST_FOOD">Fast Food</SelectItem>
                    <SelectItem value="CASUAL_DINING">Casual Dining</SelectItem>
                    <SelectItem value="FINE_DINING">Fine Dining</SelectItem>
                    <SelectItem value="CAFE">Cafe</SelectItem>
                    <SelectItem value="FOOD_TRUCK">Food Truck</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newRestaurant.description}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of the restaurant"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={newRestaurant.address}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                  className="col-span-3"
                  placeholder="Head office address"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City
                </Label>
                <Input
                  id="city"
                  value={newRestaurant.city}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
                  className="col-span-3"
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="state" className="text-right">
                  State
                </Label>
                <Input
                  id="state"
                  value={newRestaurant.state}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, state: e.target.value })}
                  className="col-span-3"
                  placeholder="State/Province"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="postalCode" className="text-right">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  value={newRestaurant.postalCode}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, postalCode: e.target.value })}
                  className="col-span-3"
                  placeholder="12345"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                  className="col-span-3"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newRestaurant.email}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                  className="col-span-3"
                  placeholder="contact@restaurant.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="website" className="text-right">
                  Website
                </Label>
                <Input
                  id="website"
                  value={newRestaurant.website}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, website: e.target.value })}
                  className="col-span-3"
                  placeholder="https://restaurant.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="establishedYear" className="text-right">
                  Established Year
                </Label>
                <Input
                  id="establishedYear"
                  type="number"
                  value={newRestaurant.establishedYear || ""}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, establishedYear: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="col-span-3"
                  placeholder="2020"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddRestaurant}>
                Create Restaurant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Restaurant</DialogTitle>
            <DialogDescription>Update restaurant information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Restaurant Name
              </Label>
              <Input
                id="edit-name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-businessType" className="text-right">
                Business Type
              </Label>
              <Select
                value={newRestaurant.businessType || ""}
                onValueChange={(value) => setNewRestaurant({ ...newRestaurant, businessType: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAST_FOOD">Fast Food</SelectItem>
                  <SelectItem value="CASUAL_DINING">Casual Dining</SelectItem>
                  <SelectItem value="FINE_DINING">Fine Dining</SelectItem>
                  <SelectItem value="CAFE">Cafe</SelectItem>
                  <SelectItem value="FOOD_TRUCK">Food Truck</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={newRestaurant.description}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address
              </Label>
              <Textarea
                id="edit-address"
                value={newRestaurant.address}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-city" className="text-right">
                City
              </Label>
              <Input
                id="edit-city"
                value={newRestaurant.city}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-state" className="text-right">
                State
              </Label>
              <Input
                id="edit-state"
                value={newRestaurant.state}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, state: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-postalCode" className="text-right">
                Postal Code
              </Label>
              <Input
                id="edit-postalCode"
                value={newRestaurant.postalCode}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, postalCode: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={newRestaurant.phone}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={newRestaurant.email}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-website" className="text-right">
                Website
              </Label>
              <Input
                id="edit-website"
                value={newRestaurant.website}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, website: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-establishedYear" className="text-right">
                Established Year
              </Label>
              <Input
                id="edit-establishedYear"
                type="number"
                value={newRestaurant.establishedYear || ""}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, establishedYear: e.target.value ? parseInt(e.target.value) : undefined })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-active" className="text-right">
                Active
              </Label>
              <div className="col-span-3">
                <Switch
                  id="edit-active"
                  checked={newRestaurant.isActive}
                  onCheckedChange={(checked) => setNewRestaurant({ ...newRestaurant, isActive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditRestaurant}>
              Update Restaurant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DataTable
        columns={columns}
        data={restaurants}
        onEdit={openEditDialog}
        onDelete={handleDeleteRestaurant}
        onView={handleViewRestaurant}
      />
    </div>
  )
}
