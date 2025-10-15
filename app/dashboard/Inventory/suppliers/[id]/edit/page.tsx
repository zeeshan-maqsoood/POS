"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supplierApi } from "@/lib/inventory-api"
import { Supplier } from "@/types/inventory"

export default function EditSupplierPage() {
  const router = useRouter()
  const params = useParams()
  const supplierId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    description: "",
    taxNumber: "",
    registrationNumber: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    address: "",
    city: "",
    state: "",
    country: "US",
    postalCode: "",
    businessType: "",
    industry: "",
    establishedYear: "",
    employeeCount: "",
    status: "ACTIVE",
    rating: "AVERAGE",
    creditLimit: "",
    paymentTerms: "NET_30",
    bankName: "",
    bankAccount: "",
    bankRouting: "",
    currency: "USD",
    notes: ""
  })

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await supplierApi.getSupplier(supplierId)
        if (response.data.success) {
          const supplierData = response.data.data
          setSupplier(supplierData)
          setFormData({
            name: supplierData.name || "",
            legalName: supplierData.legalName || "",
            description: supplierData.description || "",
            taxNumber: supplierData.taxNumber || "",
            registrationNumber: supplierData.registrationNumber || "",
            email: supplierData.email || "",
            phone: supplierData.phone || "",
            mobile: supplierData.mobile || "",
            website: supplierData.website || "",
            address: supplierData.address || "",
            city: supplierData.city || "",
            state: supplierData.state || "",
            country: supplierData.country || "US",
            postalCode: supplierData.postalCode || "",
            businessType: supplierData.businessType || "",
            industry: supplierData.industry || "",
            establishedYear: supplierData.establishedYear?.toString() || "",
            employeeCount: supplierData.employeeCount?.toString() || "",
            status: supplierData.status || "ACTIVE",
            rating: supplierData.rating || "AVERAGE",
            creditLimit: supplierData.creditLimit?.toString() || "",
            paymentTerms: supplierData.paymentTerms || "NET_30",
            bankName: supplierData.bankName || "",
            bankAccount: supplierData.bankAccount || "",
            bankRouting: supplierData.bankRouting || "",
            currency: supplierData.currency || "USD",
            notes: supplierData.notes || ""
          })
        }
      } catch (error) {
        console.error("Failed to fetch supplier:", error)
        alert("Failed to fetch supplier data.")
      } finally {
        setFetching(false)
      }
    }

    if (supplierId) {
      fetchSupplier()
    }
  }, [supplierId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Convert numeric fields
      const submitData = {
        ...formData,
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : undefined,
        creditLimit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
      }

      const response = await supplierApi.updateSupplier(supplierId, submitData)
      
      if (response.data.success) {
        router.push(`/dashboard/Inventory/suppliers/${supplierId}`)
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to update supplier:", error)
      alert("Failed to update supplier. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading supplier data...</div>
        </div>
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600 text-lg">Supplier not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Supplier</h1>
          <p className="text-gray-600 mt-2">Update supplier information</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/Inventory/suppliers/${supplierId}`)}
        >
          Back to Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Supplier Information</CardTitle>
          <CardDescription>Update the supplier's information and contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Supplier Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter supplier name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input
                  id="legalName"
                  name="legalName"
                  value={formData.legalName}
                  onChange={handleChange}
                  placeholder="Enter legal business name"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Address Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Enter postal code"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Status & Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Select value={formData.rating} onValueChange={(value) => handleSelectChange("rating", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="AVERAGE">Average</SelectItem>
                      <SelectItem value="POOR">Poor</SelectItem>
                      <SelectItem value="VERY_POOR">Very Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter supplier description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/dashboard/Inventory/suppliers/${supplierId}`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Supplier"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}