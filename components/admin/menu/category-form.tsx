"use client";
// @ts-nocheck

import * as React from "react";
import { useForm } from "react-hook-form";
import { useBranches } from "@/hooks/use-branches";
import { useUser } from "@/hooks/use-user";
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
console.log(initialData,"initialData")
  // Normalize branch name from old format to new format
  const normalizeBranchName = (branch: string): string => {
    if (!branch) return "";
    if (branch.startsWith('branch')) {
      return branch
        .replace('branch1', 'Bradford')
        .replace('branch2', 'Leeds')
        .replace('branch3', 'Helifax')
        .replace('branch4', 'Darley St Market')
    }
    return branch; // Already in new format
  };

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      isActive: initialData?.isActive ?? true,
      branchId: isAdmin ? (initialData?.branchId || "") : "", // Use initial data for editing
      restaurantId: isAdmin ? (initialData?.restaurantId || "") : "", // Use initial data for editing
    },
    mode: "onChange", // Validate on change to ensure real-time validation
  });

  // Debug form state
  const isFormValid = form.formState.isValid;
  const formErrors = form.formState.errors;
  const watchedValues = form.watch();
  const isSubmitting = form.formState.isSubmitting;

  React.useEffect(() => {
    console.log('Form state changed:', {
      isValid: isFormValid,
      errors: formErrors,
      values: watchedValues,
      isDirty: form.formState.isDirty,
      isSubmitting: isSubmitting,
      submitCount: form.formState.submitCount
    });
  }, [isFormValid, formErrors, watchedValues, form.formState.isDirty, isSubmitting, form.formState.submitCount]);

  // Force validation on mount
  React.useEffect(() => {
    if (user && !isAdmin) {
      const fetchManagerBranch = async () => {
        try {
          const response = await branchApi.getUserBranches();
          const userBranches = Array.isArray(response?.data?.data) ? response.data.data : [];

          if (userBranches.length > 0) {
            // For managers, use the first (and likely only) branch ID
            const managerBranchId = userBranches[0].id;
            console.log('Setting branchId for manager:', managerBranchId);
            form.setValue('branchId', managerBranchId, { shouldValidate: true });
          }
        } catch (error) {
          console.error('Error fetching manager branch:', error);
          // Fallback to empty string if API fails
          form.setValue('branchId', '', { shouldValidate: true });
        }
      };

      fetchManagerBranch();
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
      // Set restaurantId if available in initial data
      if (initialData.restaurantId) {
        console.log('Setting restaurantId:', initialData.restaurantId);
        form.setValue('restaurantId', initialData.restaurantId, { shouldValidate: true });
      }
      // Set branchId if available in initial data
      if (initialData.branchId) {
        console.log('Setting branchId:', initialData.branchId);
        form.setValue('branchId', initialData.branchId, { shouldValidate: true });
      }
      setFormInitialized(true);
    }
  }, [initialData?.restaurantId, initialData?.branchId, isAdmin, form]);

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
        console.log("Response data:", response?.data?.data);
        console.log("Response data type:", typeof response?.data?.data);
        console.log("Is array?", Array.isArray(response?.data?.data));

        const restaurantsData = Array.isArray(response?.data?.data) ? response.data.data : [];
        console.log("Processed restaurants data:", restaurantsData);
        setRestaurants(restaurantsData);
      } catch (error) {
        console.error("Error fetching restaurants:", error);
        setRestaurants([]);
      }
    };

    fetchRestaurants();
  }, []);
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
    if (initialData && initialData.restaurantId && isAdmin) {
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
      }).catch((error) => {
        console.error("Error fetching branches for initial restaurant:", error);
        setFilteredBranches([]);
      });
    }
  }, [initialData?.restaurantId, isAdmin]);

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
        isValid: isFormValid,
        errors: formErrors,
        values: watchedValues,
        isDirty: form.formState.isDirty,
        isSubmitting: form.formState.isSubmitting
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

      // For admins, validate branch and restaurant selection
      if (isAdmin) {
        if (!data.restaurantId || data.restaurantId.trim() === "") {
          toast({
            title: "Error",
            description: "Please select a restaurant.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        if (!data.branchId || data.branchId.trim() === "" || (data.branchId !== "global" && !data.branchId)) {
          toast({
            title: "Error",
            description: "Please select a branch.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
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
        // Create new category with proper branch normalization
        const categoryData = {
          name: data.name.trim(),
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
          isActive: data.isActive,
          branchId: data.branchId === "global" ? null : data.branchId,
          restaurantId: isAdmin ? data.restaurantId : undefined,
        };

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
            {isAdmin && (
              <FormField
                control={form.control}
                name="restaurantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant *</FormLabel>
                    <Select
                      key={`restaurant-${formInitialized}-${restaurants.length}`}
                      onValueChange={field.onChange}
                      value={field.value}
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
            )}
            {isAdmin && (
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
                        {/* Global option for all branches */}
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
            )}
            {/* Hidden branchId field for managers */}
            {!isAdmin && (
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input {...field} value={normalizeBranchName(user?.branch || "")} readOnly />
                    </FormControl>
                  </FormItem>
                )}
              />
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