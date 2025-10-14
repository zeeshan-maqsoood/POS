"use client"

import { InventoryForm } from "@/components/admin/inventory/inventory-form"
import { useRouter } from "next/navigation"

export default function AddInventoryPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Inventory Item</h1>
        <p className="text-gray-600 mt-2">Add a new product to your inventory</p>
      </div>
      <InventoryForm onSuccess={() => router.push('/dashboard/Inventory')} />
    </div>
  )
}