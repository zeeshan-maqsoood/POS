// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { toast } from "@/components/ui/use-toast";
// import { Loader2 } from "lucide-react";

// // Import API
// import managerApi from "@/lib/manager-api";
// // Import the permission utilities
// import { getAllPermissions, getPermissionLabel } from "@/lib/permissions";

// // Define the form schema
// export const managerFormSchema = z.object({
//   name: z.string().min(2, { message: "Name must be at least 2 characters." }),
//   email: z.string().email({ message: "Please enter a valid email address." }),
//   password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
//   role: z.enum(["ADMIN", "MANAGER", "CASHIER", "WAITER", "KITCHEN_STAFF", "USER"]),
//   status: z.enum(["ACTIVE", "INACTIVE"]),
//   branch: z.string().min(1, { message: "Please select a branch." }),
//   permissions: z.array(z.string()).default([]),
// });

// // Define types
// type Role = "ADMIN" | "MANAGER" | "CASHIER" | "WAITER" | "KITCHEN_STAFF" | "USER";
// type Status = "ACTIVE" | "INACTIVE";

// type ManagerFormValues = z.infer<typeof managerFormSchema>;

// interface ManagerFormProps {
//   initialData?: ManagerFormValues & {
//     id?: string;
//     role: Role;
//     status: Status;
//     permissions?: string[];
//   };
//   isEditing?: boolean;
// }

// // Group permissions by category for better UI organization
// const groupPermissionsByCategory = () => {
//   const permissions = getAllPermissions();
//   const grouped: { [key: string]: string[] } = {};

//   permissions.forEach((permission) => {
//     const [category] = permission.split("_");
//     if (!grouped[category]) grouped[category] = [];
//     grouped[category].push(permission);
//   });

//   return grouped;
// };

// // Default permissions for new managers
// const getDefaultManagerPermissions = (): string[] => [
//   "MENU_READ",
//   "MENU_UPDATE",
//   "ORDER_READ",
//   "ORDER_UPDATE",
//   "USER_READ",
//   "POS_READ"
// ];

// // Fixed permissions for kitchen staff
// const KITCHEN_STAFF_PERMISSIONS = ["ORDER_READ", "ORDER_UPDATE"];

// // Static list of branches
// const branches = [
//   { id: "branch1", name: "Main Branch" },
//   { id: "branch2", name: "Downtown Branch" },
//   { id: "branch3", name: "Uptown Branch" },
//   { id: "branch4", name: "Westside Branch" },
//   { id: "branch5", name: "Eastside Branch" }
// ];

// export function ManagerForm({ initialData, isEditing = false }: ManagerFormProps) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [permissionGroups, setPermissionGroups] = useState<{ [key: string]: string[] }>({});

//   // Initialize form with default values
//   const defaultValues: ManagerFormValues = {
//     name: "",
//     email: "",
//     password: "",
//     role: "MANAGER",
//     status: "ACTIVE",
//     branch: "",
//     permissions: getDefaultManagerPermissions(),
//   };

//   const form = useForm<ManagerFormValues>({
//     resolver: zodResolver(managerFormSchema),
//     defaultValues: { ...defaultValues, ...initialData },
//   });

//   // Load permission groups on mount
//   useEffect(() => {
//     setPermissionGroups(groupPermissionsByCategory());
//   }, []);

//   // Reset form when editing
//   useEffect(() => {
//     if (initialData) {
//       form.reset({
//         ...defaultValues,
//         ...initialData,
//         permissions: initialData.permissions || [],
//       });
//     }
//   }, [initialData]);

//   const onSubmit = async (data: ManagerFormValues) => {
//     try {
//       setIsLoading(true);

//       const managerData = {
//         name: data.name,
//         email: data.email,
//         password: data.password,
//         role: data.role,
//         status: data.status,
//         branch: data.branch,
//         permissions: data.permissions,
//         shiftStartTime: data.shiftStartTime,
//         shiftEndTime: data.shiftEndTime,
//         shiftDays: data.shiftDays,
//         isShiftActive: data.isShiftActive,
//       };

//       if (isEditing && initialData?.id) {
//         await managerApi.updateManager(initialData.id, managerData);
//         toast({
//           title: "Success",
//           description: "Manager updated successfully",
//         });
//       } else {
//         if (!data.password) throw new Error("Password is required");
//         await managerApi.createManager(managerData);
//         toast({
//           title: "Success",
//           description: "Manager created successfully",
//         });
//       }

//       router.push('/dashboard/managers');
//       router.refresh();
//     } catch (error: any) {
//       console.error('Error:', error);

//       let errorMessage = 'An error occurred while saving the manager';
//       if (error.response?.data?.message) errorMessage = error.response.data.message;
//       else if (error.message) errorMessage = error.message;

//       toast({
//         title: "Error",
//         description: errorMessage,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Determine if role is Kitchen Staff
//   const isKitchenStaff = form.watch("role") === "KITCHEN_STAFF";

//   return (
//     <div className="space-y-6">
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {/* Name */}
//             <FormField
//               control={form.control}
//               name="name"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Name</FormLabel>
//                   <FormControl>
//                     <Input placeholder="John Doe" {...field} disabled={isLoading} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Email */}
//             <FormField
//               control={form.control}
//               name="email"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Email</FormLabel>
//                   <FormControl>
//                     <Input type="email" placeholder="john@example.com" {...field} disabled={isLoading || isEditing} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Password */}
//             {!isEditing && (
//               <FormField
//                 control={form.control}
//                 name="password"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Password</FormLabel>
//                     <FormControl>
//                       <Input type="password" placeholder="Enter a password" {...field} disabled={isLoading} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             )}

//             {/* Role */}
//             <FormField
//               control={form.control}
//               name="role"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Role</FormLabel>
//                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a role" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem value="ADMIN">Admin</SelectItem>
//                       <SelectItem value="MANAGER">Manager</SelectItem>
//                       <SelectItem value="CASHIER">Cashier</SelectItem>
//                       <SelectItem value="WAITER">Waiter</SelectItem>
//                       <SelectItem value="KITCHEN_STAFF">Kitchen Staff</SelectItem>
//                       <SelectItem value="USER">User</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Branch */}
//             <FormField
//               control={form.control}
//               name="branch"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Branch</FormLabel>
//                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a branch" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {branches.map((branch) => (
//                         <SelectItem key={branch.id} value={branch.id}>
//                           {branch.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Status */}
//             <FormField
//               control={form.control}
//               name="status"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Status</FormLabel>
//                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select status" />
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem value="ACTIVE">Active</SelectItem>
//                       <SelectItem value="INACTIVE">Inactive</SelectItem>
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           </div>

//           {/* Permissions */}
//           <div className="space-y-4 pt-6 border-t">
//             <h3 className="text-lg font-medium">Permissions</h3>
//             <p className="text-sm text-muted-foreground mb-4">
//               {isKitchenStaff
//                 ? "Kitchen staff has fixed permissions and cannot be changed"
//                 : "Select the permissions to grant to this user"}
//             </p>

//             <div className="space-y-6">
//               {Object.entries(permissionGroups).map(([category, permissions]) => (
//                 <div key={category} className="space-y-3">
//                   <h4 className="text-sm font-medium capitalize">{category.toLowerCase()}</h4>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
//                     {permissions.map((permission) => {
//                       const disabled = isKitchenStaff && !KITCHEN_STAFF_PERMISSIONS.includes(permission);
//                       const checked = isKitchenStaff
//                         ? KITCHEN_STAFF_PERMISSIONS.includes(permission)
//                         : form.getValues("permissions")?.includes(permission);

//                       return (
//                         <FormField
//                           key={permission}
//                           control={form.control}
//                           name="permissions"
//                           render={({ field }) => (
//                             <FormItem
//                               className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 ${
//                                 disabled ? "opacity-50 cursor-not-allowed" : ""
//                               }`}
//                             >
//                               <FormControl>
//                                 <Checkbox
//                                   checked={checked}
//                                   disabled={disabled || isLoading}
//                                   onCheckedChange={(checkedValue) => {
//                                     if (disabled) return;
//                                     const currentPermissions = field.value || [];
//                                     const newPermissions = checkedValue
//                                       ? [...currentPermissions, permission]
//                                       : currentPermissions.filter((p) => p !== permission);
//                                     field.onChange(newPermissions);
//                                   }}
//                                 />
//                               </FormControl>
//                               <div className="space-y-1 leading-none">
//                                 <FormLabel className="font-normal">{getPermissionLabel(permission)}</FormLabel>
//                                 <p className="text-xs text-muted-foreground">
//                                   {`Can ${permission.split("_")[1].toLowerCase()} ${permission.split("_")[0].toLowerCase()}`}
//                                 </p>
//                               </div>
//                             </FormItem>
//                           )}
//                         />
//                       );
//                     })}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex justify-end pt-6 border-t">
//             <Button
//               type="button"
//               variant="outline"
//               className="mr-2"
//               onClick={() => router.push("/dashboard/managers")}
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button type="submit" disabled={isLoading}>
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   {isEditing ? "Updating..." : "Creating..."}
//                 </>
//               ) : isEditing ? (
//                 "Update Manager"
//               ) : (
//                 "Create Manager"
//               )}
//             </Button>
//           </div>
//         </form>
//       </Form>
//     </div>
//   );
// }

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
import restaurantApi from "@/lib/restaurant-api"
import branchApi from "@/lib/branch-api";
import { Branch } from "@/lib/branch-api";
// Import the permission utilities
import { getAllPermissions, getPermissionLabel, Permission } from "@/lib/permissions";

// Define shift schedule for each day
const shiftScheduleSchema = z.object({
  MONDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
  TUESDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
  WEDNESDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
  THURSDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
  FRIDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
  SATURDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
  SUNDAY: z.object({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).optional(),
}).optional();

// Define the form schema
export const managerFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }).optional(),
  role: z.enum(["MANAGER", "KITCHEN_STAFF","WAITER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  restaurantId: z.string().min(1, { message: "Please select a restaurant." }),
  branch: z.string().min(1, { message: "Please select a branch." }),
  permissions: z.array(z.string()).default([]),
  // Shift management fields - now per day
  shiftSchedule: shiftScheduleSchema.optional(),
  isShiftActive: z.boolean().optional(),
});

// Define types
type Role = "MANAGER" | "KITCHEN_STAFF" | "WAITER";
type Status = "ACTIVE" | "INACTIVE";

type ManagerFormValues = z.infer<typeof managerFormSchema>;

interface ManagerFormProps {
  initialData?: ManagerFormValues & {
    id?: string;
    role: Role;
    status: Status;
    permissions?: string[];
    shiftSchedule?: {
      MONDAY?: { startTime?: string; endTime?: string };
      TUESDAY?: { startTime?: string; endTime?: string };
      WEDNESDAY?: { startTime?: string; endTime?: string };
      THURSDAY?: { startTime?: string; endTime?: string };
      FRIDAY?: { startTime?: string; endTime?: string };
      SATURDAY?: { startTime?: string; endTime?: string };
      SUNDAY?: { startTime?: string; endTime?: string };
    };
    // Legacy fields for backward compatibility
    shiftStartTime?: string;
    shiftEndTime?: string;
    shiftDays?: string[];
    isShiftActive?: boolean;
  };
  isEditing?: boolean;
}

// Group permissions by category for better UI organization
const groupPermissionsByCategory = () => {
  const permissions = getAllPermissions();
  const grouped: { [key: string]: string[] } = {};

  permissions.forEach((permission) => {
    const [category] = permission.split("_");
    if (!grouped[category]) grouped[category] = [];
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
  "POS_READ",
];

// Fixed permissions for kitchen staff
const KITCHEN_STAFF_PERMISSIONS = ["ORDER_READ", "ORDER_UPDATE"];

// Legacy branch mapping for backward compatibility
const LEGACY_BRANCH_MAPPING: Record<string, string> = {
  "Bradford": "Main Branch",
  "Leeds": "Downtown Branch", 
  "Helifax": "Uptown Branch",
  "Darley St Market": "Westside Branch",
};

export function ManagerForm({ initialData, isEditing = false }: ManagerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<{ [key: string]: string[] }>({});
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // Initialize form with default values
  const defaultValues: ManagerFormValues = {
    name: "",
    email: "",
    password: "",
    role: "MANAGER",
    status: "ACTIVE",
    restaurantId: "",
    branch: "",
    permissions: getDefaultManagerPermissions(),
    shiftSchedule: {
      MONDAY: { startTime: "", endTime: "" },
      TUESDAY: { startTime: "", endTime: "" },
      WEDNESDAY: { startTime: "", endTime: "" },
      THURSDAY: { startTime: "", endTime: "" },
      FRIDAY: { startTime: "", endTime: "" },
      SATURDAY: { startTime: "", endTime: "" },
      SUNDAY: { startTime: "", endTime: "" },
    },
    isShiftActive: true,
  };

  const form = useForm<ManagerFormValues>({
    resolver: zodResolver(managerFormSchema),
    defaultValues: { ...defaultValues, ...initialData },
  });

  // Watch form values
  const selectedRestaurantId = form.watch("restaurantId");

  // Load permission groups on mount
  useEffect(() => {
    setPermissionGroups(groupPermissionsByCategory());
  }, []);

  // Fetch restaurants and branches on component mount
  useEffect(() => {
    const loadRestaurantsAndBranches = async () => {
      try {
        // Load restaurants
        const restaurantsResponse = await restaurantApi.getActiveRestaurants();
        const restaurantsData = restaurantsResponse.data.data || [];
        console.log('Loaded restaurants:', restaurantsData);
        setRestaurants(restaurantsData);

        // Load all branches for filtering
        const branchesResponse = await branchApi.getActiveBranches();
        const branchesData = branchesResponse.data.data || [];
        console.log('Loaded branches:', branchesData);
        setBranches(branchesData);
        // Don't show all branches initially - wait for restaurant selection
        setFilteredBranches([]);
      } catch (error) {
        console.error('Error loading restaurants and branches:', error);
      }
    };

    loadRestaurantsAndBranches();
  }, []);

  // Filter branches when restaurant selection changes
  useEffect(() => {
    if (selectedRestaurantId) {
      setIsLoadingBranches(true);

      // Use client-side filtering as the primary method since the API endpoint might not exist
      branchApi.getActiveBranches().then((allBranchesRes) => {
        const allBranches = allBranchesRes.data.data || [];
        // Filter branches that belong to the selected restaurant
        const filtered = allBranches.filter(branch =>
          branch.restaurantId === selectedRestaurantId ||
          branch.restaurant?.id === selectedRestaurantId
        );
        setFilteredBranches(filtered);
      }).catch((error) => {
        console.error("Error fetching branches:", error);
        setFilteredBranches([]);
      }).finally(() => {
        setIsLoadingBranches(false);
      });
    } else {
      // No restaurant selected, show empty list
      setFilteredBranches([]);
      setIsLoadingBranches(false);
    }
  }, [selectedRestaurantId, branches, form]);

  // Reset form when editing
  useEffect(() => {
    if (initialData) {
      // Convert legacy branch format to new format for display
      const displayBranch = initialData.branch && LEGACY_BRANCH_MAPPING[initialData.branch]
        ? LEGACY_BRANCH_MAPPING[initialData.branch]
        : initialData.branch;

      // Convert old shift format to new shiftSchedule format for editing
      let shiftSchedule: any = defaultValues.shiftSchedule;
      if (initialData.shiftSchedule) {
        shiftSchedule = initialData.shiftSchedule;
      } else if (initialData.shiftStartTime && initialData.shiftEndTime && initialData.shiftDays) {
        // Convert from old format to new format
        const { shiftStartTime, shiftEndTime, shiftDays } = initialData as any;
        shiftSchedule = {
          MONDAY: shiftDays?.includes('MONDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
          TUESDAY: shiftDays?.includes('TUESDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
          WEDNESDAY: shiftDays?.includes('WEDNESDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
          THURSDAY: shiftDays?.includes('THURSDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
          FRIDAY: shiftDays?.includes('FRIDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
          SATURDAY: shiftDays?.includes('SATURDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
          SUNDAY: shiftDays?.includes('SUNDAY') ? { startTime: shiftStartTime, endTime: shiftEndTime } : { startTime: "", endTime: "" },
        };
      }

      form.reset({
        ...defaultValues,
        ...initialData,
        restaurantId: initialData.restaurantId || "",
        branch: displayBranch, // Use mapped branch name for display
        permissions: initialData.permissions || [],
        shiftSchedule,
      });
    }
  }, [initialData]);

  const onSubmit = async (data: ManagerFormValues) => {
    try {
      setIsLoading(true);

      // Log branch information for debugging
      console.log('Manager form submission:', {
        formData: data,
        initialData: initialData,
        isEditing: isEditing
      });

      // Validate required fields
      if (!data.restaurantId || data.restaurantId.trim() === "") {
        toast({
          title: "Error",
          description: "Please select a restaurant.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!data.branch || data.branch.trim() === "") {
        // Only require branch selection if restaurant is selected and branches are loaded
        if (selectedRestaurantId && filteredBranches.length > 0) {
          toast({
            title: "Error",
            description: "Please select a branch.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const managerData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        status: data.status,
        restaurantId: data.restaurantId,
        ...(data.branch && data.branch.trim() !== "" && { branch: data.branch }),
        permissions: data.role === "KITCHEN_STAFF" ? KITCHEN_STAFF_PERMISSIONS : data.permissions,
        // Send the complete shift schedule for all days
        shiftSchedule: data.shiftSchedule,
        isShiftActive: data.isShiftActive,
      };

      console.log('Sending manager data to API:', managerData);

      if (isEditing && initialData?.id) {
        await managerApi.updateManager(initialData.id, managerData);
        toast({
          title: "Success",
          description: "Manager updated successfully",
        });
      } else {
        if (!data.password) throw new Error("Password is required");
        await managerApi.createManager(managerData);
        toast({
          title: "Success",
          description: "Manager created successfully",
        });
      }

      router.push("/dashboard/managers");
      router.refresh();
    } catch (error: any) {
      console.error("Error:", error);

      let errorMessage = "An error occurred while saving the manager";
      if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.message) errorMessage = error.message;

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if role is Kitchen Staff
  const isKitchenStaff = form.watch("role") === "KITCHEN_STAFF";

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

            {/* Password */}
            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter a password"
                        {...field}
                        disabled={isLoading}
                      />
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

            {/* Restaurant */}
            <FormField
              control={form.control}
              name="restaurantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a restaurant" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
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
                    defaultValue={field.value}
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
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Permissions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isKitchenStaff
                ? "Kitchen staff has fixed permissions and cannot be changed"
                : "Select the permissions to grant to this user"}
            </p>

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
                        render={({ field }) => {
                          const disabled =
                            isKitchenStaff &&
                            !KITCHEN_STAFF_PERMISSIONS.includes(permission);
                          const checked = isKitchenStaff
                            ? KITCHEN_STAFF_PERMISSIONS.includes(permission)
                            : field.value?.includes(permission);

                          return (
                            <FormItem
                              className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 ${
                                disabled ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              <FormControl>
                                <Checkbox
                                  checked={checked}
                                  disabled={disabled || isLoading}
                                  onCheckedChange={(checkedValue) => {
                                    if (isKitchenStaff) return; // lock Kitchen Staff
                                    const currentPermissions = field.value || [];
                                    const newPermissions = checkedValue
                                      ? [...currentPermissions, permission]
                                      : currentPermissions.filter(
                                          (p) => p !== permission
                                        );
                                    field.onChange(newPermissions);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal">
                                  {getPermissionLabel(permission as Permission)}
                                </FormLabel>
                                <p className="text-xs text-muted-foreground">
                                  {`Can ${permission
                                    .split("_")[1]
                                    .toLowerCase()} ${permission
                                    .split("_")[0]
                                    .toLowerCase()}`}
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
          </div>

          {/* Shift Management */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-medium">Shift Management</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure shift times for each day of the week
            </p>

            <div className="space-y-4">
              {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => (
                <div key={day} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3 capitalize">{day.toLowerCase()}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`shiftSchedule.${day}.startTime` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`shiftSchedule.${day}.endTime` as any}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value)}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
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
                      When enabled, this manager will have scheduled shift times for each day
                    </p>
                  </div>
                </FormItem>
              )}
            />
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