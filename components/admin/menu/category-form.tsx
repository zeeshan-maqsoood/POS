"use client";
// @ts-nocheck

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { Loader2, Save, X } from "lucide-react";
import { Category, categoryApi } from "@/lib/menu-api";
import {ImageUpload} from "@/components/ui/image-upload";
import { useBranches } from "@/hooks/use-branches";
import { useUser } from "@/hooks/use-user";
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
  branchName: z.string().optional(),
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
  const router = useRouter();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const { user, isAdmin } = useUser();

  // Normalize branch name from old format to new format
  const normalizeBranchName = (branch: string): string => {
    if (!branch) return "";
    if (branch.startsWith('branch')) {
      return branch
        .replace('branch1', 'Main Branch')
        .replace('branch2', 'Downtown Branch')
        .replace('branch3', 'Uptown Branch')
        .replace('branch4', 'Westside Branch')
        .replace('branch5', 'Eastside Branch');
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
      branchName: isAdmin ? "" : normalizeBranchName(user?.branch || ""),
    },
    mode: "onChange", // Validate on change to ensure real-time validation
  });

  // Debug form state
  const isFormValid = form.formState.isValid;
  const formErrors = form.formState.errors;
  const watchedValues = form.watch();
  const isSubmitting = form.formState.isSubmitting;

  React.useEffect(() => {
    console.log('Form state:', {
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
      const normalizedBranch = normalizeBranchName(user.branch || "");
      console.log('Setting branchName for manager:', normalizedBranch);
      form.setValue('branchName', normalizedBranch, { shouldValidate: true });
    }

    // Trigger validation after a short delay to ensure all fields are properly initialized
    const timer = setTimeout(() => {
      form.trigger();
      console.log('Form validation triggered on mount');
    }, 100);

    return () => clearTimeout(timer);
  }, [user, isAdmin, form]);

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

      // For managers, ensure branchName is set
      if (!isAdmin && (!data.branchName || data.branchName.trim() === "")) {
        toast({
          title: "Error",
          description: "Branch name is required for managers.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // For admins, validate branch selection
      if (isAdmin && (!data.branchName || data.branchName.trim() === "")) {
        toast({
          title: "Error",
          description: "Please select a branch.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log('Form validation passed, proceeding with submission');

      if (initialData) {
        // Update existing category
        const updateData = {
          ...data,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
          displayOrder: 0, // Default display order
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
          branchName: isAdmin ? data.branchName : normalizeBranchName(user?.branch || ""),
        };

        console.log('Creating category with data:', categoryData);
        console.log('Manager branch name (raw):', user?.branch);
        console.log('Manager branch name (normalized):', normalizeBranchName(user?.branch || ""));

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
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.value} value={branch.value}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {/* Hidden branchName field for managers */}
            {!isAdmin && (
              <FormField
                control={form.control}
                name="branchName"
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
        type="button"
        variant="outline"
        onClick={() => {
          console.log('Current form state:', {
            isValid: isFormValid,
            errors: formErrors,
            values: watchedValues,
            isDirty: form.formState.isDirty,
            isSubmitting: isSubmitting,
            submitCount: form.formState.submitCount
          });
          alert(`Form is ${isFormValid ? 'valid' : 'invalid'}. Check console for details.`);
        }}
      >
        Debug Form
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          form.reset();
          setIsLoading(false);
          setFormKey(Date.now()); // Force re-render
          console.log('Form reset completed');
        }}
      >
        Reset Form
      </Button>
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