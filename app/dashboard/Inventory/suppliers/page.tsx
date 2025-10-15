"use client"

import { useState, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { supplierApi } from "@/lib/inventory-api"
import { Supplier, SupplierProduct } from "@/types/inventory"

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

const PackageIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)
const BuildingIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
)

const DollarIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

export const columns: ColumnDef<Supplier>[] = [
  {
    accessorKey: "name",
    header: "Supplier Name",
    cell: ({ row }) => {
      const name: string = row.getValue("name")
      return <div className="font-medium text-gray-900">{name}</div>
    },
  },
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const code: string = row.getValue("code")
      return <div className="text-gray-700">{code}</div>
    },
  },
  {
    accessorKey: "contact.email",
    header: "Contact",
    cell: ({ row }) => {
      const contacts = row.original.contacts
      const primaryContact = contacts?.find(contact => contact.isPrimary)
      return <div className="text-gray-700">{primaryContact?.email || primaryContact?.phone || "N/A"}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string

      const getStatusConfig = (status: string) => {
        switch (status) {
          case "ACTIVE":
            return {
              variant: "default" as const,
              label: "Active",
              className: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
            }
          case "INACTIVE":
            return {
              variant: "secondary" as const,
              label: "Inactive",
              className: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"
            }
          case "SUSPENDED":
            return {
              variant: "destructive" as const,
              label: "Suspended",
              className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100"
            }
          case "BLACKLISTED":
            return {
              variant: "destructive" as const,
              label: "Blacklisted",
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
    accessorKey: "rating",
    header: "Rating",
    cell: ({ row }) => {
      const rating = row.getValue("rating") as string

      const getRatingConfig = (rating: string) => {
        switch (rating) {
          case "EXCELLENT":
            return { color: "text-green-600", label: "Excellent" }
          case "GOOD":
            return { color: "text-blue-600", label: "Good" }
          case "AVERAGE":
            return { color: "text-yellow-600", label: "Average" }
          case "POOR":
            return { color: "text-orange-600", label: "Poor" }
          case "VERY_POOR":
            return { color: "text-red-600", label: "Very Poor" }
          default:
            return { color: "text-gray-600", label: "Not Rated" }
        }
      }

      const config = getRatingConfig(rating)

      return <div className={`text-sm ${config.color}`}>{config.label}</div>
    },
  },
  {
    accessorKey: "productCount",
    header: "Products",
    cell: ({ row }) => {
      const count: number = row.getValue("productCount")
      return <div className="text-center text-gray-700">{count}</div>
    },
  },
  {
    accessorKey: "purchaseOrderCount",
    header: "Orders",
    cell: ({ row }) => {
      const count: number = row.getValue("purchaseOrderCount")
      return <div className="text-center text-gray-700">{count}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const supplier: Supplier = row.original

      const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
          try {
            await supplierApi.deleteSupplier(supplier.id)
            window.location.reload()
          } catch (error) {
            console.error("Failed to delete supplier:", error)
            alert("Failed to delete supplier. Please try again.")
          }
        }
      }

      return (
        <div className="flex items-center space-x-2">
          <Link href={`/dashboard/Inventory/suppliers/${supplier.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              View
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

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate summary statistics
  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter(supplier => supplier.status === "ACTIVE").length
  const totalProducts = suppliers.reduce((sum, supplier) => sum + supplier.productCount, 0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await supplierApi.getSuppliers()

        if (response.data.success) {
          setSuppliers(response.data.data)
        }
      } catch (err) {
        setError('Failed to fetch suppliers data')
        console.error('Error fetching suppliers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading suppliers...</div>
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
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-2">Manage your suppliers and their product relationships</p>
        </div>
        <Link href="/dashboard/Inventory/suppliers/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            Add New Supplier
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Suppliers"
          value={totalSuppliers}
          description="All registered suppliers"
          icon={<BuildingIcon />}
          color="bg-blue-500"
        />
        <SummaryCard
          title="Active Suppliers"
          value={activeSuppliers}
          description="Currently active suppliers"
          icon={<CheckIcon />}
          color="bg-green-500"
        />
        <SummaryCard
          title="Total Products"
          value={totalProducts}
          description="Products across all suppliers"
          icon={<PackageIcon />}
          color="bg-purple-500"
        />
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={suppliers}
            searchKey="name"
            filterOptions={[
              {
                label: "Status",
                value: "status",
                options: [
                  { label: "Active", value: "ACTIVE" },
                  { label: "Inactive", value: "INACTIVE" },
                  { label: "Suspended", value: "SUSPENDED" },
                  { label: "Blacklisted", value: "BLACKLISTED" }
                ]
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
