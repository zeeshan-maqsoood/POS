"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Import permission utilities
import { getAllPermissions, getPermissionLabel } from "@/lib/permissions";
// Import manager API
import managerApi from "@/lib/manager-api";
// Define the form schema
import { CreateManagerData, UpdateManagerData } from "@/lib/manager-api";
export const managerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["MANAGER", "ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  permissions: z.array(z.string()).default([]),
});

// Define types
type Role = "MANAGER" | "ADMIN";
type Status = "ACTIVE" | "INACTIVE";

type ManagerFormValues = z.infer<typeof managerFormSchema>;

interface ManagerFormProps {
  initialData?: ManagerFormValues & {
    id?: string;
    role: Role;
    status: Status;
    permissions?: string[];
  };
  isEditing?: boolean;
}

// Group permissions by category
const groupPermissionsByCategory = () => {
  const permissions = getAllPermissions();
  const grouped: { [key: string]: string[] } = {};
  permissions.forEach((permission) => {
    const [category] = permission.split("_");
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  });
  return grouped;
};

// Default permissions for new managers
const getDefaultManagerPermissions = (): string[] => [
  "ORDER_READ",
  "ORDER_UPDATE",
  "ORDER_DELETE",
  "ORDER_CREATE",
];

// This is the main edit page component that wraps the ManagerForm
export default function EditManagerPage({ params }: { params: { id: string } }) {
  const [manager, setManager] = useState<ManagerFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const response = await managerApi.getManager(params.id);
        console.log("Manager data:", response.data.data);
        setManager({
          ...response.data.data,
          permissions: response.data.data.permissions?.map((p: any) => p.permission) || []
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load manager');
        console.error('Error fetching manager:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchManager();
    } else {
      setIsLoading(false);
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Manager</h1>
      {manager ? (
        <ManagerForm 
          initialData={manager} 
          isEditing={true} 
        />
      ) : (
        <div>Manager not found</div>
      )}
    </div>
  );
}

// This is the form component that handles the actual form logic
function ManagerForm({ initialData, isEditing = false }: ManagerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<{
    [key: string]: string[];
  }>({});

  // Default values
  const defaultValues = {
    name: "",
    email: "",
    role: "MANAGER" as const,
    status: "ACTIVE" as const,
    permissions: getDefaultManagerPermissions(),
  };

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: { ...defaultValues, ...initialData },
  });

  useEffect(() => {
    setPermissionGroups(groupPermissionsByCategory());
  }, []);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...defaultValues,
        ...initialData,
        permissions: initialData.permissions || [],
      });
    }
  }, [initialData]);

  const onSubmit = async (data: ManagerFormValues) => {
    try {
      setIsLoading(true);

      if (isEditing && initialData?.id) {
        // 🔄 Update manager
        await managerApi.updateManager(initialData.id, data as UpdateManagerData);
        toast({
          title: "Manager updated",
          description: "The manager has been updated successfully.",
        });
      } else {
        // ➕ Create manager
        await managerApi.createManager(data as CreateManagerData);
        toast({
          title: "Manager created",
          description: "The manager has been created successfully.",
        });
      }

      // Redirect to managers list
      setTimeout(() => {
        router.push("/dashboard/managers");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error saving manager:", error);
      toast({
        title: "Error",
        description: "An error occurred while saving the manager.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      disabled={isLoading || isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Permissions */}
          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-medium">Permissions</h3>
            <div className="space-y-6">
              {Object.entries(permissionGroups).map(([category, permissions]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium capitalize">
                    {category.toLowerCase()}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {permissions.map((permission) => (
                      <FormField
                        key={permission}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  const currentPermissions = field.value || [];
                                  const newPermissions = checked
                                    ? [...currentPermissions, permission]
                                    : currentPermissions.filter((p) => p !== permission);
                                  field.onChange(newPermissions);
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal">
                                {getPermissionLabel(permission)}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => router.push("/dashboard/managers")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Manager"
              ) : (
                "Create Manager"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}