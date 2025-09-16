import { POSLayout } from "@/components/pos/pos-layout"

export default function POSPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">POS System</h1>
      <POSLayout />
    </div>
  )
}
