"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import managerApi from "@/lib/manager-api";
import { Manager } from "@/lib/manager-api";

export default function ManagersPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: ColumnDef<Manager>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const permissions = row.original.permissions || [];
        if (permissions.length === 0) {
          return <span className="text-muted-foreground">No permissions</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {permissions.map((perm) => (
              <Badge key={perm.id} variant="secondary">
                {perm.permission}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) =>
        new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const manager = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(`/dashboard/managers/edit/${manager.id}`)
              }
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(manager.id);
              }}
              className="text-red-600 hover:text-red-900"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const res = await managerApi.getManagers();
        setManagers(res.data.data); // ✅ API response shape: { success, message, data: [...] }
      } catch (err: any) {
        setError(err.message || "Failed to load managers");
        toast({
          title: "Error",
          description: "Failed to load managers",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchManagers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this manager? This action cannot be undone.")) return;

    try {
      setIsLoading(true);
      await managerApi.deleteManager(id);
      
      // Optimistically update the UI
      setManagers(prevManagers => prevManagers.filter(manager => manager.id !== id));
      
      toast({
        title: "Success",
        description: "Manager has been deleted successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting manager:", error);
      
      let errorMessage = "Failed to delete manager";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Managers</h1>
          <p className="text-muted-foreground">
            Manage your restaurant managers
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/managers/new")}>
          <Plus className="mr-2 h-4 w-4" /> Add Manager
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manager List</CardTitle>
          <CardDescription>
            View and manage all restaurant managers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={managers} />
        </CardContent>
      </Card>
    </div>
  );
}