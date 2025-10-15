"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supplierApi } from "@/lib/inventory-api"
import { Supplier, SupplierProduct } from "@/types/inventory"
import Link from "next/link"

export default function SupplierDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const supplierId = params.id as string

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await supplierApi.getSupplier(supplierId)
        if (response.data.success) {
          setSupplier(response.data.data)
        } else {
          setError("Failed to fetch supplier data")
        }
      } catch (err) {
        setError("Failed to fetch supplier data")
        console.error("Error fetching supplier:", err)
      } finally {
        setLoading(false)
      }
    }

    if (supplierId) {
      fetchSupplier()
    }
  }, [supplierId])

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete supplier "${supplier?.name}"? This action cannot be undone.`)) {
      try {
        await supplierApi.deleteSupplier(supplierId)
        router.push("/dashboard/Inventory/suppliers")
        router.refresh()
      } catch (error) {
        console.error("Failed to delete supplier:", error)
        alert("Failed to delete supplier. Please try again.")
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case "INACTIVE":
        return <Badge variant="secondary">Inactive</Badge>
      case "SUSPENDED":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Suspended</Badge>
      case "BLACKLISTED":
        return <Badge variant="destructive">Blacklisted</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "EXCELLENT":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
      case "GOOD":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>
      case "AVERAGE":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Average</Badge>
      case "POOR":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Poor</Badge>
      case "VERY_POOR":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Very Poor</Badge>
      default:
        return <Badge variant="secondary">Not Rated</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading supplier details...</div>
        </div>
      </div>
    )
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">{error || "Supplier not found"}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
            {getStatusBadge(supplier.status)}
            {getRatingBadge(supplier.rating)}
          </div>
          <p className="text-gray-600 mt-2">{supplier.code}</p>
          {supplier.legalName && (
            <p className="text-gray-600">Legal Name: {supplier.legalName}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/Inventory/suppliers/${supplier.id}/edit`}>
            <Button variant="outline">Edit Supplier</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            Delete Supplier
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/Inventory/suppliers")}
          >
            Back to Suppliers
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="mt-1">{supplier.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Type</label>
                  <p className="mt-1">{supplier.businessType || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Industry</label>
                  <p className="mt-1">{supplier.industry || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Terms</label>
                  <p className="mt-1">{supplier.paymentTerms?.replace(/_/g, " ") || "Not specified"}</p>
                </div>
              </div>
              {supplier.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="mt-1">{supplier.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1">{supplier.email || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1">{supplier.phone || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Mobile</label>
                  <p className="mt-1">{supplier.mobile || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Website</label>
                  <p className="mt-1">
                    {supplier.website ? (
                      <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {supplier.website}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="mt-1">
                  {supplier.address ? (
                    <>
                      {supplier.address}<br />
                      {supplier.city && `${supplier.city}, `}
                      {supplier.state} {supplier.postalCode}<br />
                      {supplier.country}
                    </>
                  ) : (
                    "No address provided"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Credit Limit</label>
                <p className="mt-1 text-lg font-semibold">
                  {supplier.creditLimit ? `$${supplier.creditLimit.toFixed(2)}` : "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Currency</label>
                <p className="mt-1">{supplier.currency}</p>
              </div>
              {supplier.bankName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="mt-1">{supplier.bankName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {supplier.taxNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Tax Number</label>
                  <p className="mt-1">{supplier.taxNumber}</p>
                </div>
              )}
              {supplier.registrationNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Registration Number</label>
                  <p className="mt-1">{supplier.registrationNumber}</p>
                </div>
              )}
              {supplier.establishedYear && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Established Year</label>
                  <p className="mt-1">{supplier.establishedYear}</p>
                </div>
              )}
              {supplier.employeeCount && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee Count</label>
                  <p className="mt-1">{supplier.employeeCount}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Total Products</label>
                <p className="mt-1 text-2xl font-bold text-blue-600">{supplier.productCount || 0}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Purchase Orders</label>
                <p className="mt-1 text-2xl font-bold text-green-600">{supplier.purchaseOrderCount || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Supplier Contacts */}
      {supplier.contacts && supplier.contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supplier.contacts.map((contact) => (
                <Card key={contact.id} className="bg-gray-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{contact.name}</h4>
                        {contact.isPrimary && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>
                        )}
                      </div>
                      {contact.position && <p className="text-sm text-gray-600">{contact.position}</p>}
                      {contact.department && <p className="text-sm text-gray-600">{contact.department}</p>}
                      {contact.email && <p className="text-sm">{contact.email}</p>}
                      {contact.phone && <p className="text-sm">{contact.phone}</p>}
                      {contact.mobile && <p className="text-sm">{contact.mobile}</p>}
                      {contact.notes && <p className="text-sm text-gray-600 mt-2">{contact.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}