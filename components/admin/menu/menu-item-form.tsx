"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  Save,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Package,
  BarChart2,
  Settings,
} from "lucide-react";
import { MenuItem, categoryApi, modifierApi, menuItemApi } from "@/lib/menu-api";
import { ImageUpload } from "@/components/ui/image-upload";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// --- Zod Schema ---
const menuItemFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
  cost: z.coerce.number().min(0, { message: "Cost cannot be negative." }),
  categoryId: z.string().min(1, { message: "Category is required." }),
  isActive: z.boolean().default(true),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  taxExempt: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  modifiers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        isActive: z.boolean(),
      })
    )
    .default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

interface MenuItemFormProps {
  initialData?: MenuItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MenuItemForm({ initialData, onSuccess, onCancel }: MenuItemFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [allModifiers, setAllModifiers] = React.useState<{ id: string; name: string; price: number }[]>([]);
  const [isModifierDropdownOpen, setIsModifierDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const router = useRouter();

  const isEditMode = !!initialData;

  const defaultValues = React.useMemo(() => {
    if (!initialData) {
      return {
        name: "",
        description: "",
        imageUrl: "",
        price: 0,
        cost: 0,
        categoryId: "",
        isActive: true,
        taxRate: 0,
        taxExempt: false,
        tags: [],
        modifiers: [],
      };
    }
    return {
      name: initialData.name || "",
      description: initialData.description || "",
      imageUrl: initialData.imageUrl || "",
      price: initialData.price || 0,
      cost: initialData.cost || 0,
      categoryId: initialData.categoryId || "",
      isActive: initialData.isActive ?? true,
      taxRate: initialData.taxRate || 0,
      taxExempt: initialData.taxExempt ?? false,
      tags: initialData.tags || [],
      modifiers: initialData.modifiers?.map((m) => ({
        id: m.id,
        name: m.name,
        price: m.price,
        isActive: m.isActive ?? true,
      })) || [],
    };
  }, [initialData]);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const filteredModifiers = React.useMemo(
    () =>
      allModifiers.filter((modifier) =>
        modifier.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [allModifiers, searchTerm]
  );

  const selectedModifiers = React.useMemo(() => {
    const selectedIds = form.getValues("modifiers")?.map((m) => m.id) || [];
    return allModifiers.filter((m) => selectedIds.includes(m.id));
  }, [allModifiers, form.watch("modifiers")]);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [categoriesRes, modifiersRes] = await Promise.all([
          categoryApi.getCategories(),
          modifierApi.getModifiers(),
        ]);
        setCategories(Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : []);
        setAllModifiers(
          Array.isArray(modifiersRes?.data?.data)
            ? modifiersRes.data.data.map((m: any) => ({
                id: m.id,
                name: m.name,
                price: m.price || 0,
              }))
            : []
        );
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load required data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: MenuItemFormValues) => {
    setIsSubmitting(true);
    try {
      const apiData = {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: Number(data.price),
        cost: Number(data.cost),
        categoryId: data.categoryId,
        isActive: data.isActive,
        taxRate: Number(data.taxRate),
        taxExempt: data.taxExempt,
        tags: data.tags || [],
        // modifiers: data.modifiers.map((m) => ({
        //   id: m.id,
        //   name: m.name,
        //   price: m.price,
        //   isActive: m.isActive,
        // })),
      };

      if (isEditMode && initialData?.id) {
        await menuItemApi.updateItem(initialData.id, apiData);
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        await menuItemApi.createItem(apiData);
        toast({ title: "Success", description: "Menu item created successfully." });
      }
      router.refresh();
      router.push("/dashboard/menu/items");
      onSuccess?.();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save menu item.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleModifier = (modifierId: string) => {
    const modifier = allModifiers.find((m) => m.id === modifierId);
    if (!modifier) return;

    const currentModifiers = form.getValues("modifiers") || [];
    const modifierIndex = currentModifiers.findIndex((m) => m.id === modifierId);

    if (modifierIndex >= 0) {
      const newModifiers = [...currentModifiers];
      newModifiers.splice(modifierIndex, 1);
      form.setValue("modifiers", newModifiers);
    } else {
      form.setValue("modifiers", [
        ...currentModifiers,
        {
          id: modifier.id,
          name: modifier.name,
          price: modifier.price || 0,
          isActive: true,
        },
      ]);
    }
  };

  const removeModifier = (modifierId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentModifiers = form.getValues("modifiers")?.filter((m) => m.id !== modifierId) || [];
    form.setValue("modifiers", currentModifiers);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading menu item data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">
              {isEditMode ? "Edit Menu Item" : "Create New Menu Item"}
            </h2>
          </div>

          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium flex items-center mb-4">
              <span className="bg-blue-100 p-1.5 rounded-lg mr-3">
                <Package className="h-5 w-5 text-blue-600" />
              </span>
              Basic Information
            </h3>
            <div className="space-y-4 md:pl-9">
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Image</FormLabel>
                    <FormControl>
                      <div className="w-full max-w-md">
                        <ImageUpload
                          value={field.value || ""}
                          onChange={(url) => field.onChange(url)}
                          onRemove={() => field.onChange("")}
                          disabled={isLoading || isSubmitting}
                          aspectRatio={4 / 3}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      Upload a high-quality image of your menu item (JPG, PNG, or WebP).
                    </FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Margherita Pizza" {...field} />
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
                      <Textarea placeholder="A delicious pizza..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium flex items-center mb-4">
              <span className="bg-green-100 p-1.5 rounded-lg mr-3">
                <BarChart2 className="h-5 w-5 text-green-600" />
              </span>
              Pricing & Details
            </h3>
            <div className="space-y-4 md:pl-9 grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxExempt"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Tax Exempt</FormLabel>
                      <FormDescription>Item is exempt from tax</FormDescription>
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
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value.join(", ")}
                        onChange={(e) =>
                          field.onChange(e.target.value.split(",").map((t) => t.trim()))
                        }
                        placeholder="Separate tags with commas"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Modifiers */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium flex items-center mb-4">
              <span className="bg-purple-100 p-1.5 rounded-lg mr-3">
                <Plus className="h-5 w-5 text-purple-600" />
              </span>
              Modifiers
            </h3>
            <div className="pl-9">
              <FormField
                control={form.control}
                name="modifiers"
                render={() => (
                  <FormItem>
                    {selectedModifiers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedModifiers.map((mod) => (
                          <Badge
                            key={mod.id}
                            variant="secondary"
                            className="pl-3 pr-1 py-1 text-sm flex items-center gap-1"
                          >
                            {mod.name}
                            <button
                              type="button"
                              onClick={(e) => removeModifier(mod.id, e)}
                              className="ml-1 p-0.5 rounded-full hover:bg-gray-200"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsModifierDropdownOpen(!isModifierDropdownOpen)
                        }
                        className="flex w-full justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <span>
                          {selectedModifiers.length
                            ? `${selectedModifiers.length} selected`
                            : "Select modifiers..."}
                        </span>
                        {isModifierDropdownOpen ? (
                          <ChevronUp className="h-4 w-4 opacity-50" />
                        ) : (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        )}
                      </button>
                      {isModifierDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                          <div className="p-2">
                            <Input
                              placeholder="Search modifiers..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="h-8 text-sm mb-1"
                            />
                          </div>
                          <Separator />
                          <ScrollArea className="max-h-60 overflow-auto">
                            {filteredModifiers.length ? (
                              filteredModifiers.map((mod) => {
                                const isSelected = form
                                  .getValues("modifiers")
                                  ?.some((m) => m.id === mod.id);
                                return (
                                  <div
                                    key={mod.id}
                                    onClick={() => toggleModifier(mod.id)}
                                    className={`flex cursor-pointer items-center px-2 py-1.5 text-sm ${
                                      isSelected ? "bg-accent" : ""
                                    }`}
                                  >
                                    <span className="mr-2">
                                      {isSelected ? (
                                        <Check className="h-4 w-4 text-primary" />
                                      ) : (
                                        <div className="h-4 w-4 border rounded border-muted-foreground/50" />
                                      )}
                                    </span>
                                    {mod.name}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                No modifiers found
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium flex items-center mb-4">
              <span className="bg-gray-100 p-1.5 rounded-lg mr-3">
                <Settings className="h-5 w-5 text-gray-600" />
              </span>
              Status
            </h3>
            <div className="space-y-4 pl-9">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Item is active and visible</FormDescription>
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

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => router.back())}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? "Update" : "Create"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}