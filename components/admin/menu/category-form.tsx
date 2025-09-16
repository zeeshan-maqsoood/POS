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
import { toast } from "@/components/ui/use-toast";
import { Loader2, Save, X } from "lucide-react";
import { Category, categoryApi } from "@/lib/menu-api";
import {ImageUpload} from "@/components/ui/image-upload";
// --- Zod Schema ---
const categoryFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
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
  const router = useRouter();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      isActive: initialData?.isActive ?? true,
    },
  });

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

      if (initialData) {
        await categoryApi.updateCategory(initialData.id, {
          ...data,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
        });
        toast({
          title: "Success",
          description: "Category updated successfully.",
        });
      } else {
        const response = await categoryApi.createCategory({
          ...data,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
        });
        if (response.status === 201) {
          toast({
            title: "Success",
            description: "Category created successfully.",
          });
        }
      }
      router.refresh();
      router.push("/dashboard/menu/categories");
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
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
            onClick={onCancel || (() => router.back())}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
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