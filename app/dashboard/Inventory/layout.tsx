"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isInventoryPage = pathname === "/inventory"

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/inventory" className="text-xl font-bold text-gray-900">
                Inventory Manager
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard/Inventory">
                  <Button
                    variant={pathname === "/dashboard/Inventory" ? "default" : "ghost"}
                    size="sm"
                    className="text-sm"
                  >
                    Items
                  </Button>
                </Link>
                <Link href="/dashboard/Inventory/suppliers">
                  <Button
                    variant={pathname.startsWith("/dashboard/Inventory/suppliers") ? "default" : "ghost"}
                    size="sm"
                    className="text-sm"
                  >
                    Suppliers
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!isInventoryPage && (
                <Link href="/dashboard/Inventory">
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ← Back to Inventory List
                  </Button>
                </Link>
              )}

            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  )
}