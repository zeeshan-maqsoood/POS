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

// Import API
import managerApi from "@/lib/manager-api";
// Import the permission utilities
import { getAllPermissions, getPermissionLabel } from "@/lib/permissions";

// Define the form schema
export const managerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
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

// Group permissions by category for better UI organization
const groupPermissionsByCategory = () => {
  const permissions = getAllPermissions();
  console.log(permissions,"permissions222")
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
  "MENU_READ",
  "MENU_UPDATE",
  "ORDER_READ",
  "ORDER_UPDATE",
  "USER_READ",
  "POS_READ"
];

export function ManagerForm({ initialData, isEditing = false }: ManagerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<{ [key: string]: string[] }>({});

  // Initialize form with default values
  const defaultValues = {
    name: "",
    email: "",
    password: "",
    role: "MANAGER" as const,
    status: "ACTIVE" as const,
    permissions: getDefaultManagerPermissions(),
  };

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: { ...defaultValues, ...initialData },
  });

  // Load permission groups on mount
  useEffect(() => {
    setPermissionGroups(groupPermissionsByCategory());
  }, []);

  // Reset form when editing
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

      const managerData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        status: data.status,
        permissions: data.permissions
      };

      if (isEditing && initialData?.id) {
        // Update existing manager
        await managerApi.updateManager(initialData.id, managerData);
        toast({
          title: "Success",
          description: "Manager updated successfully",
        });
      } else {
        // Create new manager
        if (!data.password) {
          throw new Error("Password is required");
        }
        
        await managerApi.createManager(managerData);
        
        toast({
          title: "Success",
          description: "Manager created successfully",
        });
      }

      // Redirect to managers list
      router.push('/dashboard/managers');
      router.refresh();
      
    } catch (error: any) {
      console.error('Error:', error);
      
      let errorMessage = 'An error occurred while saving the manager';
      
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

            {/* Password - only show if creating */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter a password" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Permissions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select the permissions to grant to this manager
            </p>

            <div className="space-y-6">
              {Object.entries(permissionGroups).map(([category, permissions]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium capitalize">{category.toLowerCase()}</h4>
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
                              <p className="text-xs text-muted-foreground">
                                {`Can ${permission.split("_")[1].toLowerCase()} ${permission
                                  .split("_")[0]
                                  .toLowerCase()}`}
                              </p>
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

          {/* Actions */}
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