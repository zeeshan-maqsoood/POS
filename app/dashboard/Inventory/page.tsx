"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { inventoryItemApi, inventoryCategoryApi } from "../../../lib/inventory-api"
import { restaurantApi } from "../../../lib/restaurant-api"
import { InventoryItem } from "@/types/inventory"
import type { Restaurant } from "../../../lib/restaurant-api"

// Summary card component
function SummaryCard({ title, value, description, icon, color }: {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-lg ${color} mr-4`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Icons
const PackageIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const DollarIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

export const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: "Item Name",
    cell: ({ row }) => {
      const name: string = row.getValue("name")
      return <div className="font-medium text-gray-900">{name}</div>
    },
  },
  {
    accessorKey: "category.name",
    header: "Category",
    cell: ({ row }) => {
      const category = row.original.category
      return <div className="text-gray-700 capitalize">{category?.name || "N/A"}</div>
    },
  },
  {
    accessorKey: "quantity",
    header: "Stock Level",
    cell: ({ row }) => {
      const quantity: number = row.getValue("quantity")
      const unit: string = row.original.unit
      const minStock: number = row.original.minStock
      
      const getQuantityColor = (qty: number, min: number) => {
        if (qty === 0) return "text-red-600 font-bold"
        if (qty <= min) return "text-yellow-600 font-semibold"
        return "text-green-600 font-medium"
      }
      
      return (
        <div className={`text-center ${getQuantityColor(quantity, minStock)}`}>
          {quantity} {unit}
        </div>
      )
    },
  },
  {
    accessorKey: "minStock",
    header: "Min Stock",
    cell: ({ row }) => {
      const minStock: number = row.getValue("minStock")
      const unit: string = row.original.unit
      return <div className="text-center text-gray-600">{minStock} {unit}</div>
    },
  },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: ({ row }) => {
      const cost: number = row.getValue("cost")
      const formatted = new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
      }).format(cost)
      return <div className="text-gray-700">{formatted}</div>
    },
  },
  {
    accessorKey: "supplier",
    header: "Supplier",
    cell: ({ row }) => {
      const supplier: string = row.getValue("supplier")
      return <div className="text-sm text-gray-600">{supplier}</div>
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location: string = row.getValue("location")
      return <div className="text-sm text-gray-600">{location}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      
      const getStatusConfig = (status: string) => {
        switch (status) {
          case "IN_STOCK":
            return {
              variant: "default" as const,
              label: "In Stock",
              className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
            }
          case "LOW_STOCK":
            return {
              variant: "secondary" as const,
              label: "Low Stock",
              className: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100"
            }
          case "OUT_OF_STOCK":
            return {
              variant: "destructive" as const,
              label: "Out of Stock",
              className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
            }
          default:
            return {
              variant: "default" as const,
              label: status,
              className: "bg-gray-100 text-gray-800 border-gray-200"
            }
        }
      }

      const config = getStatusConfig(status)

      return (
        <Badge 
          variant={config.variant}
          className={config.className}
        >
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "expiryDate",
    header: "Expiry Date",
    cell: ({ row }) => {
      const expiryDate: string | undefined = row.getValue("expiryDate")
      if (!expiryDate) return <div className="text-sm text-gray-400">N/A</div>
      
      const date = new Date(expiryDate)
      const today = new Date()
      const daysUntilExpiry = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      const getExpiryColor = (days: number) => {
        if (days < 0) return "text-red-600 font-bold"
        if (days <= 3) return "text-orange-600 font-semibold"
        if (days <= 7) return "text-yellow-600 font-medium"
        return "text-green-600"
      }
      
      const formatted = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      
      return (
        <div className={`text-sm ${getExpiryColor(daysUntilExpiry)}`}>
          {formatted}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const inventory: InventoryItem = row.original
      
      const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete "${inventory.name}" from inventory?`)) {
          try {
            await inventoryItemApi.deleteItem(inventory.id)
            // Refresh the page or update state
            window.location.reload()
          } catch (error) {
            console.error("Failed to delete item:", error)
            alert("Failed to delete item. Please try again.")
          }
        }
      }
      
      return (
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/Inventory/edit/${inventory.id}`}>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      )
    },
  },
]

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("all-restaurants")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate summary statistics
  const totalItems = inventoryItems.length
  const lowStockItems = inventoryItems.filter(item => item.status === "LOW_STOCK").length
  const outOfStockItems = inventoryItems.filter(item => item.status === "OUT_OF_STOCK").length
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0)

  const formattedTotalValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(totalValue)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [itemsResponse, categoriesResponse, restaurantsResponse] = await Promise.all([
          inventoryItemApi.getItems(selectedRestaurantId && selectedRestaurantId !== "all-restaurants" ? { restaurantId: selectedRestaurantId } : {}),
          inventoryCategoryApi.getCategories(),
          restaurantApi.getRestaurantsForDropdown()
        ])

        if (itemsResponse.data.success) {
          setInventoryItems(itemsResponse.data.data)
        }

        if (categoriesResponse.data.success) {
          setCategories(categoriesResponse.data.data)
        }

        if (restaurantsResponse?.data?.data) {
          setRestaurants(restaurantsResponse.data.data)
        }
      } catch (err) {
        setError('Failed to fetch inventory data')
        console.error('Error fetching inventory:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedRestaurantId])

  // Filter inventory items by selected restaurant
  const filteredInventoryItems = selectedRestaurantId && selectedRestaurantId !== "all-restaurants"
    ? inventoryItems.filter(item => item.restaurantId === selectedRestaurantId)
    : inventoryItems

  // Calculate summary statistics for filtered items
  const filteredTotalItems = filteredInventoryItems.length
  const filteredLowStockItems = filteredInventoryItems.filter(item => item.status === "LOW_STOCK").length
  const filteredOutOfStockItems = filteredInventoryItems.filter(item => item.status === "OUT_OF_STOCK").length
  const filteredTotalValue = filteredInventoryItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0)

  const filteredFormattedTotalValue = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(filteredTotalValue)

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading inventory...</div>
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

  // Prepare category filter options
  const categoryFilterOptions = categories
    .filter(category => category.id && category.id.trim() !== "")
    .map(category => ({
      label: category.name,
      value: category.id
    }))

  // Prepare restaurant filter options
  const restaurantFilterOptions = restaurants
    .filter(restaurant => restaurant.id && restaurant.id.trim() !== "")
    .map(restaurant => ({
      label: restaurant.name,
      value: restaurant.id
    }))

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Inventory</h1>
          <p className="text-gray-600 mt-2">Manage your kitchen inventory and track stock levels</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Restaurant Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="restaurant-filter" className="text-sm font-medium text-gray-700">
              Restaurant:
            </label>
            <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Restaurants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-restaurants">All Restaurants</SelectItem>
                {restaurants
                  .filter(restaurant => restaurant.id && restaurant.id.trim() !== "")
                  .map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/dashboard/Inventory/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Add New Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Items"
          value={filteredTotalItems}
          description={selectedRestaurantId && selectedRestaurantId !== "all-restaurants" ? "Items in selected restaurant" : "All inventory items"}
          icon={<PackageIcon />}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Low Stock"
          value={filteredLowStockItems}
          description="Items needing restock"
          icon={<AlertIcon />}
          color="bg-yellow-500"
        />
        <SummaryCard
          title="Out of Stock"
          value={filteredOutOfStockItems}
          description="Urgent restock needed"
          icon={<XIcon />}
          color="bg-red-500"
        />
        <SummaryCard
          title="Total Value"
          value={filteredFormattedTotalValue}
          description={selectedRestaurantId && selectedRestaurantId !== "all-restaurants" ? "Selected restaurant inventory worth" : "Current inventory worth"}
          icon={<DollarIcon />}
          color="bg-green-500"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Inventory Items
            {selectedRestaurantId && selectedRestaurantId !== "all-restaurants" && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                - {restaurants.find(r => r.id === selectedRestaurantId)?.name || "Unknown Restaurant"}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredInventoryItems}
            searchKey="name"
            filterOptions={[
              {
                label: "Status",
                value: "status",
                options: [
                  { label: "In Stock", value: "IN_STOCK" },
                  { label: "Low Stock", value: "LOW_STOCK" },
                  { label: "Out of Stock", value: "OUT_OF_STOCK" }
                ]
              },
              {
                label: "Category",
                value: "categoryId",
                options: categoryFilterOptions
              },
              {
                label: "Restaurant",
                value: "restaurantId",
                options: restaurantFilterOptions
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}