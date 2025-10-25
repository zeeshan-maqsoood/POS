"use client"

import { useState, useEffect } from "react"
import { DataTable } from "../data-table"
import { Button } from "@/components/ui/button"
import { Plus, Building } from "lucide-react"
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
import { branchApi, Branch, CreateBranchData, UpdateBranchData } from "@/lib/branch-api"
import { restaurantApi, Restaurant } from "@/lib/restaurant-api"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const columns = [
  { key: "name", label: "Branch Name", sortable: true },
  { key: "restaurantName", label: "Restaurant Name", sortable: true },
  { key: "serviceType", label: "Service Type", sortable: true },
  { key: "city", label: "City", sortable: true },
  { key: "state", label: "State", sortable: true },
  { key: "isActive", label: "Status", sortable: true },
  { key: "createdAt", label: "Created", sortable: true },
]

export function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [restaurantsLoading, setRestaurantsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("active")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [newBranch, setNewBranch] = useState<CreateBranchData>({
    name: "",
    restaurantId: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    email: "",
    manager: "",
    isActive: true,
    serviceType: "BOTH",
  })

  // Filter branches based on active tab
  const activeBranches = branches.filter(branch => branch.isActive)
  const inactiveBranches = branches.filter(branch => !branch.isActive)

  // Load branches and restaurants on component mount
  useEffect(() => {
    loadBranches()
    loadRestaurants()
  }, [])

  const loadBranches = async () => {
    try {
      setLoading(true)
      const response = await branchApi.getAllBranches()
      console.log('Raw branch response:', response.data.data)
      
      // Log each branch to see its structure
      response.data.data.forEach((branch, index) => {
        console.log(`Branch ${index}:`, {
          id: branch.id,
          name: branch.name,
          restaurantId: branch.restaurantId,
          restaurant: branch.restaurant,
          restaurantName: branch.restaurantName,
          'branch.restaurant?.name': branch.restaurant?.name,
          description: branch.description,
          address: branch.address,
          city: branch.city,
          state: branch.state,
          country: branch.country,
          postalCode: branch.postalCode,
          phone: branch.phone,
          email: branch.email,
          manager: branch.manager,
          serviceType: branch.serviceType,
          isActive: branch.isActive,
          createdAt: branch.createdAt
        })
      })
      
      setBranches(response.data.data)
    } catch (error) {
      console.error('Error loading branches:', error)
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  const loadRestaurants = async () => {
    try {
      setRestaurantsLoading(true)
      const response = await restaurantApi.getActiveRestaurants()
      setRestaurants(response.data.data)
    } catch (error) {
      console.error('Error loading restaurants:', error)
      toast.error('Failed to load restaurants')
    } finally {
      setRestaurantsLoading(false)
    }
  }

  const handleAddBranch = async () => {
    if (!newBranch.restaurantId) {
      toast.error('Please select a restaurant')
      return
    }

    try {
      const response = await branchApi.createBranch(newBranch)
      if (response.data) {
        setBranches([...branches, response.data.data])

        // New branches are created as active by default, so switch to active tab
        setActiveTab("active")

        setNewBranch({
          name: "",
          restaurantId: "",
          description: "",
          address: "",
          city: "",
          state: "",
          country: "",
          postalCode: "",
          phone: "",
          email: "",
          manager: "",
          isActive: true,
        })
        setIsAddDialogOpen(false)
        toast.success('Branch created successfully')
      }
    } catch (error) {
      console.error('Error creating branch:', error)
      toast.error('Failed to create branch')
    }
  }

  const handleEditBranch = async () => {
    if (!editingBranch) return

    if (!newBranch.restaurantId) {
      toast.error('Please select a restaurant')
      return
    }

    try {
      const updateData: UpdateBranchData = {
        name: newBranch.name,
        restaurantId: newBranch.restaurantId,
        description: newBranch.description,
        address: newBranch.address,
        city: newBranch.city,
        state: newBranch.state,
        country: newBranch.country,
        postalCode: newBranch.postalCode,
        phone: newBranch.phone,
        email: newBranch.email,
        manager: newBranch.manager,
        isActive: newBranch.isActive,
        serviceType: newBranch.serviceType,
      }

      // Check if we're deactivating an active branch
      const wasActive = editingBranch.isActive
      const isNowInactive = !newBranch.isActive

      const response = await branchApi.updateBranch(editingBranch.id, updateData)
      if (response.data) {
        setBranches(branches.map(branch =>
          branch.id === editingBranch.id ? response.data.data : branch
        ))

        // If we just deactivated a branch, switch to inactive tab
        if (wasActive && isNowInactive) {
          setActiveTab("inactive")
        }

        setIsEditDialogOpen(false)
        setEditingBranch(null)
        resetNewBranch()
        toast.success('Branch updated successfully')
      }
    } catch (error) {
      console.error('Error updating branch:', error)
      toast.error('Failed to update branch')
    }
  }

  const handleDeleteBranch = async (branch: Branch) => {
    try {
      await branchApi.deleteBranch(branch.id)

      // Update the branch in local state to mark it as inactive instead of removing it
      setBranches(branches.map(b =>
        b.id === branch.id ? { ...b, isActive: false } : b
      ))

      // Since we just deactivated an active branch, switch to inactive tab
      setActiveTab("inactive")

      toast.success('Branch deactivated successfully')
    } catch (error) {
      console.error('Error deleting branch:', error)
      toast.error('Failed to delete branch')
    }
  }

  const handleViewBranch = (branch: Branch) => {
    console.log("View branch:", branch)
    // You can implement a view dialog here if needed
  }

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch)
    setNewBranch({
      name: branch.name,
      restaurantId: branch.restaurantId,
      description: branch.description || "",
      address: branch.address || "",
      city: branch.city || "",
      state: branch.state || "",
      country: branch.country || "",
      postalCode: branch.postalCode || "",
      phone: branch.phone || "",
      email: branch.email || "",
      manager: branch.manager || "",
      serviceType: branch.serviceType,
      isActive: branch.isActive,
    })
    setIsEditDialogOpen(true)
  }

  const resetNewBranch = () => {
    setNewBranch({
      name: "",
      restaurantId: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      phone: "",
      email: "",
      manager: "",
      isActive: true,
      serviceType: "BOTH",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading branches...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Branch Management</h2>
          <p className="text-muted-foreground">Manage your restaurant branches and locations</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) resetNewBranch()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
              <DialogDescription>Create a new restaurant branch location.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Branch Name
                </Label>
                <Input
                  id="name"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Downtown Branch"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="restaurantId" className="text-right">
                  Restaurant
                </Label>
                <Select
                  value={newBranch.restaurantId}
                  onValueChange={(value) => setNewBranch({ ...newBranch, restaurantId: value })}
                  disabled={restaurantsLoading}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={restaurantsLoading ? "Loading restaurants..." : "Select a restaurant"} />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={newBranch.description}
                  onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Brief description of the branch"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  className="col-span-3"
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="city" className="text-right">
                  City
                </Label>
                <Input
                  id="city"
                  value={newBranch.city}
                  onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
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
                  value={newBranch.state}
                  onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })}
                  className="col-span-3"
                  placeholder="State/Province"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="country" className="text-right">
                  Country
                </Label>
                <Input
                  id="country"
                  value={newBranch.country}
                  onChange={(e) => setNewBranch({ ...newBranch, country: e.target.value })}
                  className="col-span-3"
                  placeholder="Country"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="postalCode" className="text-right">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  value={newBranch.postalCode}
                  onChange={(e) => setNewBranch({ ...newBranch, postalCode: e.target.value })}
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
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
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
                  value={newBranch.email}
                  onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                  className="col-span-3"
                  placeholder="branch@example.com"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="manager" className="text-right">
                  Manager
                </Label>
                <Input
                  id="manager"
                  value={newBranch.manager}
                  onChange={(e) => setNewBranch({ ...newBranch, manager: e.target.value })}
                  className="col-span-3"
                  placeholder="Manager name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceType" className="text-right">
                  Service Type
                </Label>
                <Select
                  value={newBranch.serviceType}
                  onValueChange={(value: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH') => setNewBranch({ ...newBranch, serviceType: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DINE_IN">Dine In</SelectItem>
                    <SelectItem value="TAKE_AWAY">Take Away</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleAddBranch}>
                Create Branch
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>Update branch information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Branch Name
              </Label>
              <Input
                id="edit-name"
                value={newBranch.name}
                onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-restaurantId" className="text-right">
                Restaurant
              </Label>
              <Select
                value={newBranch.restaurantId}
                onValueChange={(value) => setNewBranch({ ...newBranch, restaurantId: value })}
                disabled={restaurantsLoading}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={restaurantsLoading ? "Loading restaurants..." : "Select a restaurant"} />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={newBranch.description}
                onChange={(e) => setNewBranch({ ...newBranch, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address
              </Label>
              <Textarea
                id="edit-address"
                value={newBranch.address}
                onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-city" className="text-right">
                City
              </Label>
              <Input
                id="edit-city"
                value={newBranch.city}
                onChange={(e) => setNewBranch({ ...newBranch, city: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-state" className="text-right">
                State
              </Label>
              <Input
                id="edit-state"
                value={newBranch.state}
                onChange={(e) => setNewBranch({ ...newBranch, state: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-country" className="text-right">
                Country
              </Label>
              <Input
                id="edit-country"
                value={newBranch.country}
                onChange={(e) => setNewBranch({ ...newBranch, country: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-postalCode" className="text-right">
                Postal Code
              </Label>
              <Input
                id="edit-postalCode"
                value={newBranch.postalCode}
                onChange={(e) => setNewBranch({ ...newBranch, postalCode: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={newBranch.phone}
                onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
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
                value={newBranch.email}
                onChange={(e) => setNewBranch({ ...newBranch, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-manager" className="text-right">
                Manager
              </Label>
              <Input
                id="edit-manager"
                value={newBranch.manager}
                onChange={(e) => setNewBranch({ ...newBranch, manager: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-serviceType" className="text-right">
                Service Type
              </Label>
              <Select
                value={newBranch.serviceType}
                onValueChange={(value: 'DINE_IN' | 'TAKE_AWAY' | 'BOTH') => setNewBranch({ ...newBranch, serviceType: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DINE_IN">Dine In</SelectItem>
                  <SelectItem value="TAKE_AWAY">Take Away</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-active" className="text-right">
                Active
              </Label>
              <div className="col-span-3">
                <Switch
                  id="edit-active"
                  checked={newBranch.isActive}
                  onCheckedChange={(checked) => setNewBranch({ ...newBranch, isActive: checked })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditBranch}>
              Update Branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Active Branches ({activeBranches.length})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Inactive Branches ({inactiveBranches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <DataTable
            columns={columns}
            data={activeBranches}
            onEdit={openEditDialog}
            onDelete={handleDeleteBranch}
            onView={handleViewBranch}
          />
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <DataTable
            columns={columns}
            data={inactiveBranches}
            onEdit={openEditDialog}
            onView={handleViewBranch}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
