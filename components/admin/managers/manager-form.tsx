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

// Import the permission utilities
import { getAllPermissions, getPermissionLabel, DefaultRolePermissions, PermissionGroups } from "@/lib/permissions";

// Define the form schema
export const managerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["MANAGER", "KITCHEN_STAFF","WAITER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  permissions: z.array(z.string()).default([]).transform((val) => val || []),
  // Shift management fields
  shiftStartTime: z.string().optional(),
  shiftEndTime: z.string().optional(),
  shiftDays: z.array(z.string()).optional(),
  isShiftActive: z.boolean().optional(),
});

// Define types
type Role = 'MANAGER' | 'KITCHEN_STAFF' | 'WAITER';
type Status = 'ACTIVE' | 'INACTIVE';

type ManagerFormValues = z.infer<typeof managerFormSchema>;

interface ManagerFormProps {
  initialData?: ManagerFormValues & { 
    id?: string;
    role: Role;
    status: Status;
    permissions?: string[];
    shiftStartTime?: string;
    shiftEndTime?: string;
    shiftDays?: string[];
    isShiftActive?: boolean;
  };
  isEditing?: boolean;
}

// Define permission dependencies
const PERMISSION_DEPENDENCIES: Record<string, string[]> = {
  'ORDER_CREATE': ['ORDER_READ'],
  'ORDER_UPDATE': ['ORDER_READ'],
  'ORDER_DELETE': ['ORDER_READ'],
  'MENU_CREATE': ['MENU_READ'],
  'MENU_UPDATE': ['MENU_READ'],
  'MENU_DELETE': ['MENU_READ'],
  'USER_CREATE': ['USER_READ'],
  'USER_UPDATE': ['USER_READ'],
  'USER_DELETE': ['USER_READ'],
  'MANAGER_CREATE': ['MANAGER_READ'],
  'MANAGER_UPDATE': ['MANAGER_READ'],
};

// Group permissions by category for better UI organization
const groupPermissionsByCategory = () => {
  const permissions = getAllPermissions();
  const grouped: { [key: string]: string[] } = {};
  
  permissions.forEach(permission => {
    const [category] = permission.split('_');
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(permission);
  });
  
  return grouped;
};

// Default permissions for new managers - now using the permissions system
const getDefaultManagerPermissions = (): string[] => {
  return [...DefaultRolePermissions.MANAGER];
};

// Get default permissions based on role
const getDefaultPermissionsForRole = (role: Role): string[] => {
  switch (role) {
    case 'MANAGER':
      return [...DefaultRolePermissions.MANAGER];
    case 'KITCHEN_STAFF':
      return [...DefaultRolePermissions.KITCHEN_STAFF];
    case 'WAITER':
      return [...DefaultRolePermissions.WAITER];
    default:
      return [...DefaultRolePermissions.MANAGER];
  }
};

export function ManagerForm({ initialData, isEditing = false }: ManagerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<{[key: string]: string[]}>({});
  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState(false);

  // Initialize form with default values
  const defaultValues = {
    name: "",
    email: "",
    role: "MANAGER" as const,
    status: "ACTIVE" as const,
    permissions: getDefaultPermissionsForRole("MANAGER"),
    shiftStartTime: "",
    shiftEndTime: "",
    shiftDays: [],
    isShiftActive: false,
  };

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: { ...defaultValues, ...initialData },
  });

  // Watch the permissions field to debug
  const watchedPermissions = form.watch('permissions');

  // Ensure permissions are always initialized
  useEffect(() => {
    const currentPermissions = form.getValues('permissions');
    const currentRole = form.getValues('role');

    if (!currentPermissions || currentPermissions.length === 0) {
      const defaultPerms = getDefaultPermissionsForRole(currentRole);
      form.setValue('permissions', defaultPerms);
    }
  }, [form]);

  // Load permission groups on mount
  useEffect(() => {
    console.log('Loading permission groups...');
    const groups = groupPermissionsByCategory();
    console.log('Permission groups loaded:', groups);
    setPermissionGroups(groups);
    setIsPermissionsLoaded(true);

    // For new managers, ensure default permissions are set after permission groups are loaded
    if (!initialData) {
      console.log('Setting default permissions for new manager:', getDefaultPermissionsForRole("MANAGER"));
      const defaultPermissions = getDefaultPermissionsForRole("MANAGER");
      form.setValue('permissions', defaultPermissions);
    }
  }, [initialData, form]);

  // Handle role changes - update permissions when role changes
  useEffect(() => {
    const currentRole = form.getValues('role');
    const currentPermissions = form.getValues('permissions');

    // Only update permissions if this is not an edit operation or if permissions are empty
    if (!initialData || !currentPermissions || currentPermissions.length === 0) {
      const defaultPermissions = getDefaultPermissionsForRole(currentRole);
      console.log(`Setting default permissions for role ${currentRole}:`, defaultPermissions);
      form.setValue('permissions', defaultPermissions);
    }
  }, [form.getValues('role'), form, initialData]);

  console.log('Current form permissions:', watchedPermissions);

  const onSubmit = async (data: ManagerFormValues) => {
    try {
      setIsLoading(true);
      
      // Handle form submission
      const url = isEditing && initialData?.id 
        ? `/api/users/managers/${initialData.id}`
        : '/api/users/managers';
      
      const method = isEditing ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save manager');
      }
      
      await response.json();
      
      toast({
        title: isEditing ? 'Manager updated' : 'Manager created',
        description: isEditing 
          ? 'The manager has been updated successfully.'
          : 'The manager has been created successfully.',
      });
      
      // Redirect to managers list after a short delay
      setTimeout(() => {
        router.push('/dashboard/managers');
        router.refresh();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving manager:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while saving the manager.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            
            {/* Permissions Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-medium">Permissions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select the permissions to grant to this manager
              </p>

              
                <div className="space-y-6">
                  {/* Debug Button */}
                 

                  {Object.entries(permissionGroups).map(([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h4 className="text-sm font-medium capitalize">{category.toLowerCase()}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {permissions.map((permission) => (
                          <FormField
                            key={permission}
                            control={form.control}
                            name="permissions"
                            render={({ field }) => {
                              const isChecked = field.value?.includes(permission) || false;

                              return (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                                  <FormControl>
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const currentPermissions = field.value || [];
                                        let newPermissions;

                                        if (checked) {
                                          newPermissions = [...currentPermissions, permission];
                                          // Handle permission dependencies
                                          if (PERMISSION_DEPENDENCIES[permission]) {
                                            PERMISSION_DEPENDENCIES[permission].forEach(dep => {
                                              if (!newPermissions.includes(dep)) {
                                                newPermissions.push(dep);
                                              }
                                            });
                                          }
                                        } else {
                                          newPermissions = currentPermissions.filter(p => p !== permission);
                                        }

                                        field.onChange(newPermissions);
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                      {getPermissionLabel(permission)}
                                    </FormLabel>
                                    <p className="text-xs text-muted-foreground">
                                      {`Can ${permission.split('_')[1].toLowerCase()} ${permission.split('_')[0].toLowerCase()}`}
                                    </p>
                                  </div>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              
            {/* Shift Management Section */}
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-medium">Shift Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure shift times and working days for this manager
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="shiftStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shiftEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shift End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="shiftDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Working Days</FormLabel>
                    <div className="grid grid-cols-7 gap-2">
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(day) || false}
                            onCheckedChange={(checked) => {
                              const currentDays = field.value || [];
                              let newDays;
                              if (checked) {
                                newDays = [...currentDays, day];
                              } else {
                                newDays = currentDays.filter(d => d !== day);
                              }
                              field.onChange(newDays);
                            }}
                          />
                          <label className="text-sm font-medium leading-none">
                            {day.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isShiftActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Enable Shift Management
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        When enabled, this manager will have scheduled shift times and working days
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2" 
                onClick={() => router.push('/dashboard/managers')}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </span>
                ) : isEditing ? (
                  "Update Manager"
                ) : (
                  "Create Manager"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
