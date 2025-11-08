"use client";
// @ts-nocheck

import * as React from "react";
import { useForm } from "react-hook-form";
import { useBranches } from "@/hooks/use-branches";
import { useUser, type Branch } from "@/hooks/use-user";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {ImageUpload} from "@/components/ui/image-upload";
import { Loader2, Save, X } from "lucide-react";
import { restaurantApi } from "@/lib/restaurant-api";
import { branchApi } from "@/lib/branch-api";
import { Category } from "@/lib/menu-api";
import { categoryApi } from "@/lib/menu-api";
// --- Zod Schema ---
const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  imageUrl: z.string().optional().refine((val) => {
    if (!val || val === "") return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, {
    message: "Please enter a valid URL or leave empty.",
  }),
  isActive: z.boolean().default(true),
  branchId: z.string().min(1, { message: "Branch is required." }),
  restaurantId: z.string().min(1, { message: "Restaurant is required." }),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({
  initialData,
  onSuccess,
  onCancel,
}: CategoryFormProps): JSX.Element {
  const [isLoading, setIsLoading] = React.useState(false);
  const [formKey, setFormKey] = React.useState(Date.now()); // Force re-render key
  const [restaurants, setRestaurants] = React.useState<{ id: string; name: string }[]>([]);
  const [filteredBranches, setFilteredBranches] = React.useState<{ id: string; name: string }[]>([]);
  const [formInitialized, setFormInitialized] = React.useState(false);
  const router = useRouter();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const { user, isAdmin } = useUser();
  console.log(user,"usercategory")
  // Helper function to get branch name from different data structures
  const getBranchName = (branch: Branch | string | null | undefined): string => {
    if (!branch) return '';
    if (typeof branch === 'string') return branch;
    if (branch && typeof branch === 'object' && 'name' in branch) {
      return branch.name;
    }
    return '';
  };
  
  // Helper function to get branch ID from different data structures
  const getBranchId = (branch: any): string => {
    if (!branch) {
      console.warn('No branch data provided');
      return '';
    }
    
    console.log('getBranchId input:', branch);
    
    // If branch is a string, it could be the ID, name, or branchX format
    if (typeof branch === 'string') {
      // Check if it's a valid UUID
      if (branch.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return branch;
      }
      
      // Check if it's in the format 'branch1', 'branch2', etc.
      if (branch.match(/^branch\d+$/)) {
        return branch; // Return as is for backward compatibility
      }
      
      // If we have branches data, try to find the branch by name
      if (branches && branches.length > 0) {
        const foundBranch = branches.find(b => 
          b.name === branch || 
          b.name?.toLowerCase() === branch.toLowerCase()
        );
        
        if (foundBranch?.id) {
          console.log(`Found branch ID for name '${branch}':`, foundBranch.id);
          return foundBranch.id;
        }
      }
      
      console.warn('Branch is a string but no matching branch found:', branch);
      return branch; // Return as is if no match found
    }
    
    // If branch is an object, try to extract the ID
    if (typeof branch === 'object') {
      // Handle case where branch data might be nested under a 'branch' property
      if (branch.branch) {
        return getBranchId(branch.branch); // Recursively process the nested branch object
      }
      
      // Handle direct branch object
      if (branch.id) return branch.id;
      if (branch._id) return branch._id;
      
      // Handle case where branch might have a name but no ID
      if (branch.name) {
        // If it's a full branch object with name but no ID, try to find it in branches list
        if (branches && branches.length > 0) {
          const foundBranch = branches.find(b => 
            b.name === branch.name || 
            b.name?.toLowerCase() === branch.name?.toLowerCase()
          );
          
          if (foundBranch?.id) {
            console.log(`Found branch ID for object with name '${branch.name}':`, foundBranch.id);
            return foundBranch.id;
          }
        }
        
        console.warn('Branch object has name but no ID, and no match in branches list:', branch.name);
        return branch.name;
      }
      
      // If we have a branchId field, use that
      if (branch.branchId) return branch.branchId;
      
      // If we have a branch object with a name property, use that
      const branchName = branch.branch?.name || branch.name;
      if (branchName) {
        return getBranchId(branchName); // Recursively process the branch name
      }
    }
    
    console.warn('Could not extract branch ID from:', branch);
    return '';
  };
console.log(initialData,"initialData")
  // Normalize branch name from old format to new format
  const normalizeBranchName = (branch: any): string => {
    if (!branch) return "";
    
    // Handle case where branch is an object with a name property
    const branchName = typeof branch === 'string' 
      ? branch 
      : branch?.name || branch?.branchName || '';
    
    if (typeof branchName === 'string' && branchName.startsWith('branch')) {
      return branchName
        .replace('branch1', 'Bradford')
        .replace('branch2', 'Leeds')
        .replace('branch3', 'Helifax')
        .replace('branch4', 'Darley St Market');
    }
    
    // If branch is an object but we couldn't get a name, try to use the ID
    if (typeof branch !== 'string' && !branchName && branch?.id) {
      return branch.id;
    }
    
    return branchName || ''; // Return empty string if no valid branch name found
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      isActive: initialData?.isActive ?? true,
      branchId: initialData?.branchId || "",
      restaurantId: initialData?.restaurantId || "",
    },
    mode: "onChange", // Validate on change to ensure real-time validation
  });
  
  // Update form values when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        isActive: initialData.isActive ?? true,
      });
    }
  }, [initialData, form]);

  // Form state
  const { isValid, errors, isSubmitting, isDirty } = form.formState;
  const watchedValues = form.watch();
  
  // Check if all required fields are filled
  const isFormValid = React.useMemo(() => {
    const { name, branchId } = watchedValues;
    return Boolean(name && branchId);
  }, [watchedValues]);
  
  // Debug form state
  React.useEffect(() => {
    console.log('Form state:', {
      values: watchedValues,
      isValid,
      errors,
      isSubmitting,
      isDirty,
      isFormValid
    });
  }, [watchedValues, isValid, errors, isSubmitting, isDirty, isFormValid]);

  // Set up manager's branch and restaurant
  React.useEffect(() => {
    if (user && !isAdmin) {
      const setupManagerData = async () => {
        try {
          // Set restaurant from user data if available
          if (user.restaurant?.id) {
            form.setValue('restaurantId', user.restaurant.id, { shouldValidate: true });
          }
          
          // Set branch from user data if available
          if (user.branch) {
            const branchId = getBranchId(user.branch);
            if (branchId) {
              console.log('Setting branchId for manager from user data:', branchId);
              form.setValue('branchId', branchId, { shouldValidate: true });
              return;
            }
          }
          
          // Fallback to API if branch not in user data
          const response = await branchApi.getUserBranches();
          const userBranches = Array.isArray(response?.data?.data) ? response.data.data : [];

          if (userBranches.length > 0) {
            const managerBranchId = userBranches[0].id;
            console.log('Setting branchId for manager from API:', managerBranchId);
            form.setValue('branchId', managerBranchId, { shouldValidate: true });
          }
        } catch (error) {
          console.error('Error setting up manager data:', error);
        }
      };

      setupManagerData();
    }
  }, [user, isAdmin, form]);

  // Handle initial data changes for restaurant and branch selection
  React.useEffect(() => {
    if (initialData && isAdmin) {
      console.log('Setting initial form values:', {
        restaurantId: initialData.restaurantId,
        branchId: initialData.branchId,
        branchName: initialData.branchName
      });
      
      // Set initial form values
      form.reset({
        name: initialData.name || "",
        description: initialData.description || "",
        imageUrl: initialData.imageUrl || "",
        isActive: initialData.isActive ?? true,
        branchId: initialData.branchId || "",
        restaurantId: initialData.restaurantId || ""
      });
      
      setFormInitialized(true);
    } else if (initialData && !isAdmin) {
      // For non-admin users, ensure branch is set if available
      if (initialData.branchId) {
        form.setValue('branchId', initialData.branchId, { shouldValidate: true });
      }
      setFormInitialized(true);
    }
  }, [initialData, isAdmin, form]);

  // Trigger validation after a short delay to ensure all fields are properly initialized
  React.useEffect(() => {
    const timer = setTimeout(() => {
      form.trigger();
      console.log('Form validation triggered on mount');
    }, 100);

    return () => clearTimeout(timer);
  }, [form]);

  // Fetch restaurants and handle branch filtering
  React.useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        console.log("Fetching restaurants...");
        const response = await restaurantApi.getRestaurantsForDropdown();
        console.log("Restaurant API response:", response);
        
        const restaurantsData = Array.isArray(response?.data?.data) ? response.data.data : [];
        console.log("Processed restaurants data:", restaurantsData);
        setRestaurants(restaurantsData);
        
        // If we have initialData with a restaurantId, set it after restaurants are loaded
        if (initialData?.restaurantId) {
          console.log('Setting restaurant after fetch:', initialData.restaurantId);
          // Use setTimeout to ensure the select component is rendered before setting the value
          setTimeout(() => {
            form.setValue('restaurantId', initialData.restaurantId, { shouldValidate: true });
            
            // Also set the branch if available
            if (initialData.branchId) {
              console.log('Setting branch after restaurant:', initialData.branchId);
              form.setValue('branchId', initialData.branchId, { shouldValidate: true });
            }
          }, 0);
        }
        
        setFormInitialized(true);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setRestaurants([]);
      }
    };

    fetchRestaurants();
  }, [initialData?.restaurantId, initialData?.branchId]);
  // Fetch branches when restaurant is selected
  React.useEffect(() => {
    const selectedRestaurantId = form.watch("restaurantId");
    console.log('Restaurant selection changed:', selectedRestaurantId);
    if (selectedRestaurantId) {
      console.log('Fetching branches for restaurant:', selectedRestaurantId);
      branchApi.getBranchesByRestaurant(selectedRestaurantId).then((res) => {
        const restaurantBranches = Array.isArray(res?.data?.data) ? res.data.data : [];
        console.log('Fetched branches:', restaurantBranches);
        setFilteredBranches(restaurantBranches.map(branch => ({
          id: branch.id,
          name: branch.name
        })));
      }).catch((error) => {
        console.error("Error fetching branches for restaurant:", error);
        setFilteredBranches([]);
      });
    } else {
      setFilteredBranches([]);
    }
  }, [form.watch("restaurantId")]);

  // Also fetch branches when initial data is loaded for editing
  React.useEffect(() => {
    if (initialData?.restaurantId && isAdmin) {
      console.log('Fetching branches for initial restaurant (editing):', initialData.restaurantId);
      branchApi.getBranchesByRestaurant(initialData.restaurantId).then((res) => {
        const restaurantBranches = Array.isArray(res?.data?.data) ? res.data.data : [];
        console.log('Fetched branches for editing:', restaurantBranches);
        const mappedBranches = restaurantBranches.map(branch => ({
          id: branch.id,
          name: branch.name
        }));
        setFilteredBranches(mappedBranches);
        console.log('Set filtered branches:', mappedBranches);
        
        // Ensure the branch is selected after branches are loaded
        if (initialData.branchId) {
          console.log('Setting branch after branches loaded:', initialData.branchId);
          form.setValue('branchId', initialData.branchId, { shouldValidate: true });
        }
      }).catch((error) => {
        console.error("Error fetching branches for initial restaurant:", error);
        setFilteredBranches([]);
      });
    }
  }, [initialData?.restaurantId, initialData?.branchId, isAdmin, form]);

  const handleApiError = (error: any) => {
    console.error("API Error:", error);
    let errorMessage = "Something went wrong. Please try again.";

    if (error?.response?.status === 401) {
      errorMessage = "Your session has expired. Please log in again.";
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else if (error?.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      setIsLoading(true);

      // Debug current form state
      console.log('Form submission triggered with data:', data);
      console.log('Current form state:', {
        isValid: form.formState.isValid,
        errors: form.formState.errors,
        values: form.getValues(),
        isDirty: form.formState.isDirty,
        isSubmitting: form.formState.isSubmitting,
        userBranch: user?.branch,
        isAdmin: user?.role === 'ADMIN',
        userRestaurant: user?.restaurant
      });

      // Validate required fields
      if (!data.name || data.name.trim().length < 2) {
        toast({
          title: "Error",
          description: "Category name must be at least 2 characters long.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Handle admin vs manager flow
      if (isAdmin) {
        // For admins, validate restaurant and branch selection
        if (!data.restaurantId || data.restaurantId.trim() === "") {
          toast({
            title: "Error",
            description: "Please select a restaurant.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // If branch is not selected but required, show error
        if (!data.branchId || data.branchId.trim() === "") {
          toast({
            title: "Error",
            description: "Please select a branch or choose 'Global' if this is a global category.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else {
        // For managers, ensure we have a valid branch ID
        const userBranchId = getBranchId(user?.branch);
        console.log('Manager branch data:', { userBranch: user?.branch, userBranchId });
        
        if (!userBranchId) {
          toast({
            title: "Error",
            description: "Unable to determine your branch. Please contact support.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // Update the form data with the correct branch ID
        data.branchId = userBranchId;
        
        // Set restaurant ID from user data if not already set
        if (!data.restaurantId && user?.restaurant?.id) {
          data.restaurantId = typeof user.restaurant.id === 'string' 
            ? user.restaurant.id 
            : user.restaurant.id;
        }
        
        console.log('Manager form data updated:', { 
          branchId: data.branchId, 
          restaurantId: data.restaurantId 
        });
      }

      console.log('Form validation passed, proceeding with submission');

      if (initialData) {
        // Update existing category
        const updateData = {
          ...data,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
          branchId: data.branchId === "global" ? null : data.branchId,
        };
        console.log('Updating category with data:', updateData);

        await categoryApi.updateCategory(initialData.id, updateData);
        toast({
          title: "Success",
          description: "Category updated successfully.",
        });
      } else {
        // Prepare the category data
        const categoryData: any = {
          name: data.name.trim(),
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
          isActive: data.isActive,
          branchId: data.branchId === "global" ? null : data.branchId,
          restaurantId: data.restaurantId
        };
        
        // For managers, ensure we're using their assigned branch and restaurant
        if (!isAdmin && user) {
          // Always use the branch ID from the form data for managers
          // as it's already been validated and set above
          if (data.branchId) {
            categoryData.branchId = data.branchId;
            console.log('Using manager branch ID from form data:', categoryData.branchId);
          } else {
            // Fallback to user's branch if for some reason it's not in form data
            const userBranchId = getBranchId(user.branch);
            if (userBranchId) {
              categoryData.branchId = userBranchId;
              console.log('Using manager branch ID from user data:', categoryData.branchId);
            }
          }
          
          // Use the manager's restaurant if not set
          if (!categoryData.restaurantId && user.restaurant) {
            categoryData.restaurantId = typeof user.restaurant === 'string' 
              ? user.restaurant 
              : user.restaurant.id;
            console.log('Using manager restaurant ID:', categoryData.restaurantId);
          }
        } else if (isAdmin) {
          // For admins, ensure we have valid restaurant and branch
          if (!categoryData.restaurantId) {
            throw new Error('Restaurant ID is required');
          }
          
          // If branch is 'global', set to null, otherwise ensure it's a valid UUID
          if (categoryData.branchId === 'global') {
            categoryData.branchId = null;
          } else if (categoryData.branchId && !categoryData.branchId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            console.warn('Invalid branch ID format, setting to null:', categoryData.branchId);
            categoryData.branchId = null;
          }
        }
        
        // Remove undefined values
        Object.keys(categoryData).forEach(key => 
          categoryData[key] === undefined && delete categoryData[key]
        );
        
        // Ensure branchId is a valid UUID or null
        if (categoryData.branchId && 
            !categoryData.branchId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) &&
            categoryData.branchId !== 'global') {
          console.warn('Invalid branch ID format, setting to null:', categoryData.branchId);
          categoryData.branchId = null;
        }
        
        // Log the final data being sent
        console.log('Final category data:', {
          ...categoryData,
          isAdmin,
          userBranch: user?.branch,
          formBranchId: data.branchId,
          finalBranchId: categoryData.branchId
        });
        
        console.log('Final category data before submission:', categoryData);

        console.log('Creating category with data:', categoryData);
        console.log('Manager branch ID (raw):', user?.branch);
        console.log('Manager branch ID (normalized):', normalizeBranchName(user?.branch || ""));

        try {
          const response = await categoryApi.createCategory(categoryData as any);
          console.log('API response:', response);
          console.log('API response data:', response.data);
          console.log('API response status:', response.status);

          if (response.data && response.data.statusCode === 201) {
            toast({
              title: "Success",
              description: "Category created successfully.",
            });
          } else {
            const errorMsg = response.data?.message || "Failed to create category";
            console.error('API returned non-201 status:', response.data);
            throw new Error(errorMsg);
          }
        } catch (apiError: any) {
          console.error('API error details:', apiError);
          console.error('API error response:', apiError.response);
          console.error('API error message:', apiError.message);
          throw apiError;
        }
      }
      router.refresh();
      router.push("/dashboard/menu/categories");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting form:", error);
      console.error("Error details:", {
        message: error?.message || 'Unknown error',
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data
      });
      handleApiError(error);
    } finally {
      setIsLoading(false);
      // Reset form submission state
      form.reset(form.getValues(), { keepValues: true });
      console.log('Form submission completed and state reset');
    }
  };

  return (
    <Form {...form} key={formKey}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Appetizers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short description of this category"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isAdmin ? (
              <>
                <FormField
                  control={form.control}
                  name="restaurantId"
                  render={({ field }) => {
                    console.log('Restaurant field value:', field.value);
                    return (
                      <FormItem>
                        <FormLabel>Restaurant *</FormLabel>
                        <Select
                          key={`restaurant-${formInitialized}-${restaurants.length}`}
                          onValueChange={(value) => {
                            console.log('Restaurant selected:', value);
                            field.onChange(value);
                            // Reset branch when restaurant changes
                            form.setValue('branchId', '');
                            setFilteredBranches([]);
                          }}
                          value={field.value || ''}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a restaurant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {restaurants.map((restaurant) => (
                              <SelectItem 
                                key={restaurant.id} 
                                value={restaurant.id}
                              >
                                {restaurant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <Select
                        key={`branch-${formInitialized}-${filteredBranches.length}`}
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch">
                              {field.value === "global"
                                ? "🌐 Global (All Branches)"
                                : field.value
                                  ? filteredBranches.find(b => b.id === field.value)?.name || field.value
                                  : "Select a branch"
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem key="global" value="global">
                            🌐 Global (All Branches)
                          </SelectItem>
                          {filteredBranches.length > 0 ? (
                            filteredBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-muted-foreground">
                              {restaurants.length > 0 ? "Select a restaurant first" : "No branches available"}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              // Show read-only branch info for non-admin users (managers)
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Restaurant</p>
                  <div className="flex items-center p-2 border rounded-md bg-gray-50">
                    <span className="text-sm">
                      {user?.restaurant?.name || 'Not assigned'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Branch</p>
                  <div className="flex items-center p-2 border rounded-md bg-gray-50">
                    <span className="text-sm">
                      {getBranchName(user?.branch) || 'Not assigned'}
                    </span>
                  </div>
                </div>
                {/* Hidden branchId field for managers */}
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => {
                    // Get branch ID using the helper function
                    const branchId = getBranchId(user?.branch);
                    
                    // Ensure the field value is set
                    if (branchId && branchId !== field.value) {
                      field.onChange(branchId);
                    }
                    
                    return (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input {...field} value={branchId} readOnly />
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Category Image</h3>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value || ""}
                      onChange={field.onChange}
                      onRemove={() => field.onChange("")}
                      disabled={isLoading}
                      aspectRatio={16 / 9}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status</h3>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      When active, this category will be visible to customers.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

    <div className="flex justify-end space-x-4">
   
    
      <Button
        type="submit"
        disabled={isLoading || isSubmitting || !isFormValid}
        className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
        onClick={() => {
          console.log('Submit clicked - Form state:', {
            values: form.getValues(),
            isValid: form.formState.isValid,
            errors: form.formState.errors
          });
        }}
      >
        {isLoading || isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {initialData ? "Saving Changes..." : "Creating Category..."}
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            {initialData ? "Save Changes" : "Create Category"}
          </>
        )}
      </Button>
    </div>
  </form>
</Form>
);
}