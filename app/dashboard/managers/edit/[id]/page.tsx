
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
// Assuming these UI components are correctly aliased and available
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

// NOTE: These utility and API imports are assumed to be correct based on the context
import { getAllPermissions, getPermissionLabel } from "@/lib/permissions";
import type { Permission } from "@/types/prisma";
import managerApi, { Manager, CreateManagerData, UpdateManagerData } from "@/lib/manager-api";
import restaurantApi from "@/lib/restaurant-api";
import branchApi from "@/lib/branch-api";
import type { Branch } from "@/lib/branch-api";

// ----------------------------------------------------
// 1. Zod Schema and Types
// ----------------------------------------------------

export const managerFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.enum(["MANAGER", "KITCHEN_STAFF", "ADMIN", "CASHIER", "WAITER", "USER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  restaurantId: z.string().min(1, {
    message: "Please select a restaurant.",
  }),
  branch: z.string().min(1, {
    message: "Please select a branch.",
  }),
  permissions: z.array(z.string()).default([]),
  shiftSchedule: z.object({
    MONDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
    TUESDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
    WEDNESDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
    THURSDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
    FRIDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
    SATURDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
    SUNDAY: z.object({ startTime: z.string(), endTime: z.string() }).optional(),
  }).optional(),
  isShiftActive: z.boolean().optional(),
});

type Role = "MANAGER" | "KITCHEN_STAFF" | "ADMIN" | "CASHIER" | "WAITER" | "USER";
type Status = "ACTIVE" | "INACTIVE";
type ManagerFormValues = z.infer<typeof managerFormSchema>;

interface ManagerFormProps {
  initialData?: ManagerFormValues & {
    id?: string;
    role: Role;
    status: Status;
    permissions?: string[];
    branch?: string;
    restaurantId?: string;
    lastLogin?: string;
    createdAt?: string;
    updatedAt?: string;
    shiftSchedule?: ManagerFormValues['shiftSchedule'];
    isShiftActive?: boolean;
  };
  isEditing?: boolean;
}

// ----------------------------------------------------
// 2. Utility Functions
// ----------------------------------------------------

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

const getDefaultManagerPermissions = (): string[] => [
  "ORDER_READ",
  "ORDER_UPDATE",
  "ORDER_DELETE",
  "ORDER_CREATE",
];

// ----------------------------------------------------
// 3. EditManagerPage Component (Wrapper/Data Fetcher)
// ----------------------------------------------------

export default function EditManagerPage({ params }: { params: { id: string } }) {
  const [manager, setManager] = useState<ManagerFormProps['initialData'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchManager = async () => {
      try {
        setIsLoading(true);
        const managerResponse = await managerApi.getManager(params.id);
        const managerData = managerResponse.data.data as Manager;

        if (!managerData) {
          throw new Error('Manager not found');
        }

        // Map API data to form values
        const managerFormData = {
          name: managerData.name || '',
          email: managerData.email || '',
          role: managerData.role || 'MANAGER',
          status: managerData.status || 'ACTIVE',
          restaurantId: managerData.branch?.restaurant?.id || '',
          branch: managerData.branch?.id || '',
          permissions: Array.isArray(managerData.permissions) 
            ? managerData.permissions.map((p: any) => p.permission) 
            : [],
          id: managerData.id,
          lastLogin: managerData.lastLogin,
          createdAt: managerData.createdAt,
          updatedAt: managerData.updatedAt,
          shiftSchedule: managerData.shiftSchedule || undefined,
          isShiftActive: Boolean(managerData.isShiftActive),
        };

        console.log('Fetched manager data:', managerFormData);
        setManager(managerFormData);
        setError(null);
      } catch (err: any) {
        console.error('Error loading manager:', err);
        setError(err.message || 'Failed to load manager');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchManager();
    } else {
      setIsLoading(false);
      setError('No manager ID provided');
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

  // Add a key to force re-render when manager data changes
  const formKey = manager ? `manager-form-${manager.id}-${manager.updatedAt || ''}` : 'manager-form';

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Manager</h1>
      {manager ? (
        <ManagerForm
          key={formKey}
          initialData={manager}
          isEditing={true}
          onManagerUpdated={() => {
            // Refetch manager data when updated
            if (params.id) {
              fetchManager();
            }
          }}
        />
      ) : (
        <div>Manager not found</div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// 4. ManagerForm Component (The actual form logic)
// ----------------------------------------------------

function ManagerForm({ initialData, isEditing = false, onManagerUpdated }: ManagerFormProps & { onManagerUpdated?: () => void }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<{
    [key: string]: string[];
  }>({});
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Initializing the default shift schedule structure for UI coherence
  const defaultShiftSchedule = useMemo(() => ({
    MONDAY: { startTime: "", endTime: "" },
    TUESDAY: { startTime: "", endTime: "" },
    WEDNESDAY: { startTime: "", endTime: "" },
    THURSDAY: { startTime: "", endTime: "" },
    FRIDAY: { startTime: "", endTime: "" },
    SATURDAY: { startTime: "", endTime: "" },
    SUNDAY: { startTime: "", endTime: "" },
  }), []);

  // Set up form with initial values
  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || "MANAGER",
      status: initialData?.status || "ACTIVE",
      restaurantId: initialData?.restaurantId || "",
      branch: initialData?.branch || "",
      permissions: Array.isArray(initialData?.permissions) ? initialData.permissions : [],
      shiftSchedule: initialData?.shiftSchedule || { ...defaultShiftSchedule },
      isShiftActive: initialData?.isShiftActive || false,
    } as ManagerFormValues,
    mode: 'onChange',
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      const formData = {
        ...initialData,
        // Ensure these are always set to valid values
        permissions: Array.isArray(initialData.permissions) ? initialData.permissions : [],
        restaurantId: initialData.restaurantId || "",
        branch: initialData.branch || "",
        shiftSchedule: {
          ...defaultShiftSchedule,
          ...(initialData.shiftSchedule || {})
        }
      };
      
      // Only reset if the form values are different to prevent unnecessary re-renders
      const currentValues = form.getValues();
      if (JSON.stringify(currentValues) !== JSON.stringify(formData)) {
        form.reset(formData);
        console.log('Form reset with data:', formData);
      }
    }
  }, [initialData, form, defaultShiftSchedule]);

  // Watchers for conditional logic
  const selectedRestaurantId = form.watch("restaurantId");
  const shiftSchedule = useWatch({ control: form.control, name: "shiftSchedule" });
  const role = useWatch({ control: form.control, name: "role" });

  // Load permission groups once
  useEffect(() => {
    setPermissionGroups(groupPermissionsByCategory());
  }, []);

  // Load restaurants and all branches on component mount
  useEffect(() => {
    const loadRestaurantsAndBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const [restaurantsResponse, branchesResponse] = await Promise.all([
          restaurantApi.getActiveRestaurants(),
          branchApi.getActiveBranches()
        ]);
        
        const restaurantsData = (restaurantsResponse as any)?.data?.data || [];
        setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : []);

        const branchesData = (branchesResponse as any)?.data?.data || [];
        const allBranches = Array.isArray(branchesData) ? branchesData : [];
        setBranches(allBranches);

        // If we have initial data, set up the initial restaurant and branch selection
        if (isEditing && initialData?.restaurantId) {
          // Set restaurant first
          form.setValue('restaurantId', initialData.restaurantId, {
            shouldValidate: true,
            shouldDirty: false
          });

          // Then set branch after a small delay to allow the restaurant to be set
          if (initialData.branch) {
            setTimeout(() => {
              form.setValue('branch', initialData.branch as string, { 
                shouldValidate: true,
                shouldDirty: false 
              });
              
              // Also update filtered branches
              const filtered = allBranches.filter(branch =>
                (branch.restaurantId === initialData.restaurantId ||
                 branch.restaurant?.id === initialData.restaurantId)
              );
              setFilteredBranches(filtered);
            }, 100);
          }
        }
      } catch (error) {
        console.error('❌ Error loading resources:', error);
        toast({
          title: 'Error',
          description: 'Failed to load restaurants and branches.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingBranches(false);
      }
    };

    loadRestaurantsAndBranches();
  }, [isEditing, initialData, form]);

  // Effect to handle branch filtering and initial branch selection
  useEffect(() => {
    if (branches.length === 0) return;
    
    if (selectedRestaurantId) {
      setIsLoadingBranches(true);

      // Filter branches for the selected restaurant
      const filtered = branches.filter(branch =>
        branch.restaurantId === selectedRestaurantId ||
        branch.restaurant?.id === selectedRestaurantId
      );
      setFilteredBranches(filtered);

      // Handle initial branch selection for edit mode
      if (isEditing && initialData?.branch) {
        const branchExists = filtered.some(b => b.id === initialData.branch);
        if (branchExists) {
          // Use setTimeout to ensure the select component is ready
          setTimeout(() => {
            form.setValue('branch', initialData.branch as string, { 
              shouldValidate: true, 
              shouldDirty: false 
            });
          }, 0);
        } else if (selectedRestaurantId !== initialData.restaurantId) {
          form.setValue('branch', "");
        }
      }

      setIsLoadingBranches(false);
    } else {
      setFilteredBranches([]);
      // Clear branch if restaurant is deselected
      if (form.getValues('branch')) {
          form.setValue('branch', "");
      }
    }
  }, [selectedRestaurantId, branches, isEditing, initialData, form.setValue, form.getValues]);

  const onSubmit = async (data: ManagerFormValues) => {
    try {
      setIsLoading(true);

      // Clean up shiftSchedule: remove days that have no start/end time
      const cleanedShiftSchedule = Object.entries(data.shiftSchedule || {})
        .filter(([, schedule]) => schedule?.startTime && schedule?.endTime)
        .reduce((acc, [day, schedule]) => ({ ...acc, [day]: schedule }), {});

      let finalPermissions = data.permissions || [];
      if (data.role === 'KITCHEN_STAFF') {
        finalPermissions = ['ORDER_READ', 'ORDER_UPDATE']; // Enforce kitchen staff permissions
      }

      const payload = {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        branchId: data.branch,
        permissions: finalPermissions.map(p => p as Permission),
        shiftSchedule: Object.keys(cleanedShiftSchedule).length > 0 ? cleanedShiftSchedule : undefined,
        isShiftActive: data.isShiftActive,
      };

      if (isEditing && initialData?.id) {
        // Update manager
        await managerApi.updateManager(initialData.id, payload as UpdateManagerData);
        toast({
          title: "Manager updated",
          description: "The manager has been updated successfully.",
        });
      } else {
        // Create manager
        await managerApi.createManager(payload as unknown as CreateManagerData);
        toast({
          title: "Manager created",
          description: "The manager has been created successfully.",
        });
      }

      // Call the update callback if provided
      if (onManagerUpdated) {
        onManagerUpdated();
      } else {
        // Fallback to redirect if no callback
        router.push("/dashboard/managers");
        router.refresh();
      }

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
                    onValueChange={(value) => {
                      field.onChange(value as Role);
                      if (value === 'KITCHEN_STAFF') {
                        form.setValue('permissions', getDefaultManagerPermissions());
                      }
                    }}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["ADMIN", "MANAGER", "KITCHEN_STAFF", "CASHIER", "WAITER", "USER"].map((roleValue) => (
                        <SelectItem key={roleValue} value={roleValue}>
                          {roleValue.replace('_', ' ')}
                        </SelectItem>
                      ))}
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
                    value={field.value}
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

            {/* Restaurant */}
            <FormField
              control={form.control}
              name="restaurantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset branch when restaurant changes to trigger filtering/validation
                      form.setValue("branch", "");
                    }}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a restaurant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {restaurants.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Loading restaurants...
                        </div>
                      ) : (
                        restaurants.map((restaurant) => (
                          <SelectItem key={restaurant.id} value={restaurant.id}>
                            {restaurant.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch */}
            <FormField
              control={form.control}
              name="branch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading || isLoadingBranches || !selectedRestaurantId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isLoadingBranches
                            ? "Loading branches..."
                            : !selectedRestaurantId
                              ? "Select restaurant first"
                              : filteredBranches.length === 0
                                ? "No branches available"
                                : "Select a branch"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingBranches ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Loading branches...
                        </div>
                      ) : !selectedRestaurantId ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Select restaurant first
                        </div>
                      ) : filteredBranches.length > 0 ? (
                        filteredBranches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No branches available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          {/* ----------------- Permissions ----------------- */}
          <div className="space-y-6 pt-6 border-t">
            <h3 className="text-lg font-medium">Permissions</h3>

            {role === 'KITCHEN_STAFF' ? (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  Kitchen staff are automatically assigned only read and update permissions for orders.
                </p>
                <div className="space-y-2">
                  {['ORDER_READ', 'ORDER_UPDATE'].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2 p-2 bg-white rounded border">
                      <Checkbox checked={true} disabled />
                      <span className="text-sm font-medium">
                        {getPermissionLabel(permission)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* ----------------- Shift Management ----------------- */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Shift Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure shift times and working days for this manager.
            </p>

            {/* Days of the week with time inputs */}
            <div className="space-y-4">
              {[
                { key: 'MONDAY', label: 'Monday' },
                { key: 'TUESDAY', label: 'Tuesday' },
                { key: 'WEDNESDAY', label: 'Wednesday' },
                { key: 'THURSDAY', label: 'Thursday' },
                { key: 'FRIDAY', label: 'Friday' },
                { key: 'SATURDAY', label: 'Saturday' },
                { key: 'SUNDAY', label: 'Sunday' },
              ].map((day) => {
                const isDayActive = !!shiftSchedule?.[day.key];

                return (
                  <div key={day.key} className="p-4 border rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Checkbox
                        checked={isDayActive}
                        onCheckedChange={(checked) => {
                          const currentSchedule = { ...form.getValues('shiftSchedule') };
                          if (checked) {
                            currentSchedule[day.key] = { startTime: "", endTime: "" };
                          } else {
                            delete currentSchedule[day.key];
                          }
                          form.setValue('shiftSchedule', currentSchedule, { shouldDirty: true });
                        }}
                        disabled={isLoading}
                      />
                      <label className="text-sm font-medium">{day.label}</label>
                    </div>

                    {isDayActive && (
                      <div className="grid grid-cols-2 gap-3 ml-6">
                        <FormField
                          control={form.control}
                          name={`shiftSchedule.${day.key}.startTime` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Start Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  value={field.value || ""}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`shiftSchedule.${day.key}.endTime` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">End Time</FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  value={field.value || ""}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <FormField
              control={form.control}
              name="isShiftActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Enable Shift Management
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      When enabled, this manager will have scheduled shift times and working days enforced.
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* ----------------- Buttons ----------------- */}
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