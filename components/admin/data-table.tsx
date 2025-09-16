"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Filter } from "lucide-react"

interface Column {
  key: string
  label: string
  sortable?: boolean
}

interface DataTableProps {
  columns: Column[]
  data: Record<string, any>[]
  onEdit?: (item: any) => void
  onDelete?: (item: any) => void
  onView?: (item: any) => void
}

export function DataTable({ columns, data, onEdit, onDelete, onView }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn]
    const bValue = b[sortColumn]

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const renderCellValue = (value: any) => {
    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? "Active" : "Inactive"}</Badge>
    }
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }
    return String(value)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="rounded-md border shadow-lg shadow-white/20 bg-white/95 backdrop-blur-sm border-white/30 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/50 backdrop-blur-sm">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.sortable ? "cursor-pointer hover:bg-muted" : ""}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-xs">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow key={index} className="hover:bg-white/70 hover:shadow-sm transition-all duration-200">
                {columns.map((column) => (
                  <TableCell key={column.key}>{renderCellValue(item[column.key])}</TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && <DropdownMenuItem onClick={() => onView(item)}>View</DropdownMenuItem>}
                      {onEdit && <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>}
                      {onDelete && (
                        <DropdownMenuItem onClick={() => onDelete(item)} className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedData.length === 0 && <div className="text-center py-8 text-muted-foreground">No data found</div>}
    </div>
  )
}
