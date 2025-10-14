"use client"

import { useState, useEffect } from "react"
import { InventoryForm } from "@/components/admin/inventory/inventory-form"
import { notFound, useRouter } from "next/navigation"
import { inventoryItemApi } from "../../../../../lib/inventory-api"
import { InventoryItem } from "@/types/inventory"

interface EditInventoryPageProps {
  params: {
    id: string
  }
}

export default function EditInventoryPage({ params }: EditInventoryPageProps) {
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await inventoryItemApi.getItem(params.id)
        if (response.data.success) {
          setInventoryItem(response.data.data)
        } else {
          setError('Item not found')
        }
      } catch (err) {
        setError('Failed to fetch inventory item')
        console.error('Error fetching item:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchItem()
  }, [params.id])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    )
  }

  if (error || !inventoryItem) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Edit Inventory Item</h1>
        <p className="text-gray-600 mt-2">Update the product information for {inventoryItem.name}</p>
      </div>
      <InventoryForm 
        initialData={inventoryItem} 
        isEdit={true} 
        onSuccess={() => router.push('/dashboard/Inventory')}
      />
    </div>
  )
}