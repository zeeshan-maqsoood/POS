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
  ChefHat,
} from "lucide-react";
import { MenuItem, categoryApi, modifierApi, menuItemApi } from "@/lib/menu-api";
import  { inventoryItemApi } from "@/lib/inventory-api";
import { ImageUpload } from "@/components/ui/image-upload";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useBranches } from "@/hooks/use-branches";
import { useUser } from "@/hooks/use-user";

const units = ["kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"];

const menuItemFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
  cost: z.coerce.number().min(0, { message: "Cost cannot be negative." }),
  categoryId: z.string().optional(),
  branchName: z.string().min(1, { message: "Branch is required." }),
  isActive: z.boolean().default(true),
  taxRate: z.number().min(0).default(0),
  taxExempt: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  modifiers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        isActive: z.boolean(),
        options: z.array(z.string()).default([]),
        minSelection: z.number().default(0),
        maxSelection: z.number().default(0),
        type: z.string().default("SINGLE"),
      })
    )
    .default([]),
  ingredients: z
    .array(
      z.object({
        inventoryItemId: z.string(),
        name: z.string(),
        quantity: z.number().min(0.01, { message: "Quantity must be greater than 0" }),
        unit: z.string(),
        currentStock: z.number().optional(),
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
  const [allModifiers, setAllModifiers] = React.useState<{
    type: string; 
    id: string; 
    name: string; 
    price: number; 
    isActive?: boolean 
  }[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<{
    id: string;
    name: string;
    quantity: number;
    unit: string;
    branchName?: string;
  }[]>([]);
  const [isModifierDropdownOpen, setIsModifierDropdownOpen] = React.useState(false);
  const [isIngredientDropdownOpen, setIsIngredientDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [ingredientSearchTerm, setIngredientSearchTerm] = React.useState("");
  const [showCategoryHelp, setShowCategoryHelp] = React.useState(false);
  
  const router = useRouter();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const { user, isAdmin } = useUser();
  
  const isEditMode = !!initialData;
console.log(initialData,"initialData")
  const normalizeBranchName = (branch: string): string => {
    if (!branch) return "";
    if (branch.startsWith('branch')) {
      return branch
        .replace('branch1', 'Bradford')
        .replace('branch2', 'Leeds')
        .replace('branch3', 'Helifax')
        .replace('branch4', 'Darley St Market');
    }
    return branch;
  };

  const defaultValues = React.useMemo(() => {
    const baseValues = {
      name: "",
      description: "",
      imageUrl: "",
      price: 0,
      cost: 0,
      branchName: normalizeBranchName(user?.branch || ""),
      isActive: true,
      taxRate: 0,
      taxExempt: false,
      tags: [],
      modifiers: [],
      ingredients: [],
      categoryId: ""
    };

    if (!initialData) return baseValues;

    // Process modifiers from initialData
    let modifiers = [];
    if (initialData.modifiers && Array.isArray(initialData.modifiers)) {
      modifiers = initialData.modifiers
        .filter(mod => mod && mod.modifier)
        .map(mod => ({
          id: mod.modifier.id,
          name: mod.modifier.name || `Modifier ${mod.modifier.id}`,
          price: mod.modifier.price || 0,
          isActive: mod.modifier.isActive !== false,
          type: mod.modifier.type || "SINGLE"
        }));
    }

    // Process ingredients from initialData
      // Process ingredients from initialData
  let ingredients = [];
  
  // Check if we have menuItemIngredients with inventoryItem data
  if (initialData.menuItemIngredients && Array.isArray(initialData.menuItemIngredients)) {
    console.log('Found menuItemIngredients:', initialData.menuItemIngredients);
    
    // We need to fetch the inventory item details for each menuItemIngredient
    // For now, we'll create a placeholder and fetch the actual data in the reset effect
    ingredients = initialData.menuItemIngredients
      .filter(ing => ing && ing.inventoryItemId)
      .map(ing => ({
        inventoryItemId: ing.inventoryItemId,
        name: `Loading...`, // Placeholder - will be updated when inventory items are loaded
        quantity: ing.quantity || 0,
        unit: ing.unit || "pieces",
        currentStock: 0 // Placeholder
      }));
    
    console.log('Created placeholder ingredients:', ingredients);
  }

    return {
      ...initialData,
      modifiers,
      ingredients
    };
  }, [initialData, user?.branch]);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues,
  });

  // Reset form when initialData or allModifiers changes
  React.useEffect(() => {
    if (initialData) {
      const formattedModifiers = initialData.modifiers
        ?.filter(mod => mod && mod.modifier)
        .map(mod => {
          const fullModifier = allModifiers.find(m => m.id === mod.modifier.id) || mod.modifier;
          return {
            id: fullModifier.id,
            name: fullModifier.name || `Modifier ${fullModifier.id}`,
            price: fullModifier.price || 0,
            isActive: fullModifier.isActive !== false,
            type: fullModifier.type || "SINGLE"
          };
        }) || [];

      const formattedIngredients = initialData.ingredients
        ?.filter(ing => ing && ing.inventoryItem)
        .map(ing => ({
          inventoryItemId: ing.inventoryItem.id,
          name: ing.inventoryItem.name,
          quantity: ing.quantity || 0,
          unit: ing.unit || "pieces",
          currentStock: ing.inventoryItem.quantity
        })) || [];

      form.reset({
        ...initialData,
        modifiers: formattedModifiers,
        ingredients: formattedIngredients
      });
    }
  }, [initialData, allModifiers, form]);

  // Fetch categories, modifiers, and inventory items
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const categoriesParams = isAdmin ? {} : { 
          branchName: normalizeBranchName(user?.branch || "") 
        };

        const [categoriesRes, modifiersRes, inventoryRes] = await Promise.all([
          categoryApi.getCategories(categoriesParams),
          modifierApi.getModifiers(),
          inventoryItemApi.getItems(),
        ]);
console.log(inventoryRes,"inventryRes")
        setCategories(Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : []);
        
        const allModifiersData = Array.isArray(modifiersRes?.data?.data) 
          ? modifiersRes.data.data.map((m: any) => ({
              id: m.id,
              name: m.name,
              price: m.price || 0,
              isActive: m.isActive ?? true,
            }))
          : [];
        
        setAllModifiers(allModifiersData);

        // Filter inventory items by branch for managers
        let inventoryData = Array.isArray(inventoryRes?.data?.data) ? inventoryRes.data.data : [];
        console.log(inventoryData,"inventryData")
        if (!isAdmin && user?.branch) {
          const userBranch = normalizeBranchName(user.branch);
          inventoryData = inventoryData.filter((item: any) => 
            item.branch === userBranch || item.branchName === userBranch
          );
        }

        setInventoryItems(inventoryData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || "pieces",
          branchName: item.branch || item.branchName
        })));

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
  }, [user, isAdmin]);
// Update ingredient names and stock after inventory items are loaded
React.useEffect(() => {
  if (!initialData || inventoryItems.length === 0) return;

  const updatedIngredients = (initialData.menuItemIngredients || [])
    .filter((ing) => ing && ing.inventoryItemId)
    .map((ing) => {
      const inventory = inventoryItems.find(
        (item) => item.id === ing.inventoryItemId
      );
      return {
        inventoryItemId: ing.inventoryItemId,
        name: inventory?.name || ing.inventoryItem?.name || "Unknown",
        quantity: ing.quantity || 0,
        unit: ing.unit || inventory?.unit || "pieces",
        currentStock: inventory?.quantity || 0,
      };
    });

  // Reset form with updated ingredient names
  form.setValue("ingredients", updatedIngredients);
}, [inventoryItems, initialData, form]);
  const selectedModifiers = React.useMemo(() => {
    try {
      const formModifiers = form.getValues("modifiers");
      
      if (!Array.isArray(formModifiers)) {
        return [];
      }
      
      return formModifiers
        .map(mod => {
          if (!mod) return null;
          const fullModifier = allModifiers.find(m => m.id === mod.id);
          return fullModifier ? {
            id: fullModifier.id,
            name: fullModifier.name,
            price: fullModifier.price,
            isActive: fullModifier.isActive !== false
          } : null;
        })
        .filter((m): m is NonNullable<typeof m> => m !== null);
    } catch (error) {
      console.error('Error getting selected modifiers:', error);
      return [];
    }
  }, [allModifiers, form.watch("modifiers")]);

  const selectedIngredients = React.useMemo(() => {
    try {
      const formIngredients = form.getValues("ingredients");
      return Array.isArray(formIngredients) ? formIngredients : [];
    } catch (error) {
      console.error('Error getting selected ingredients:', error);
      return [];
    }
  }, [form.watch("ingredients")]);

  const filteredModifiers = React.useMemo(() => {
    return allModifiers.filter(
      modifier => 
        modifier.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedModifiers.some(selected => selected.id === modifier.id)
    );
  }, [allModifiers, searchTerm, selectedModifiers]);

  const filteredInventoryItems = React.useMemo(() => {
    return inventoryItems.filter(
      item => 
        item.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) &&
        !selectedIngredients.some(selected => selected.inventoryItemId === item.id)
    );
  }, [inventoryItems, ingredientSearchTerm, selectedIngredients]);

  const handleAddModifier = (modifier: { id: string; name: string; price: number }) => {
    const currentModifiers = form.getValues("modifiers") || [];
    form.setValue("modifiers", [
      ...currentModifiers,
      {
        ...modifier,
        isActive: true,
        options: [],
        minSelection: 0,
        maxSelection: 0,
        type: "SINGLE"
      }
    ]);
    setSearchTerm("");
  };

  const handleRemoveModifier = (modifierId: string) => {
    const currentModifiers = form.getValues("modifiers") || [];
    form.setValue(
      "modifiers",
      currentModifiers.filter(mod => mod.id !== modifierId)
    );
  };

  const handleAddIngredient = (inventoryItem: { id: string; name: string; unit: string }) => {
    const currentIngredients = form.getValues("ingredients") || [];
    form.setValue("ingredients", [
      ...currentIngredients,
      {
        inventoryItemId: inventoryItem.id,
        name: inventoryItem.name,
        quantity: 1,
        unit: inventoryItem.unit,
        currentStock: inventoryItems.find(item => item.id === inventoryItem.id)?.quantity || 0
      }
    ]);
    setIngredientSearchTerm("");
    setIsIngredientDropdownOpen(false);
  };

  const handleRemoveIngredient = (inventoryItemId: string) => {
    const currentIngredients = form.getValues("ingredients") || [];
    form.setValue(
      "ingredients",
      currentIngredients.filter(ing => ing.inventoryItemId !== inventoryItemId)
    );
  };

  const handleIngredientQuantityChange = (inventoryItemId: string, quantity: number) => {
    const currentIngredients = form.getValues("ingredients") || [];
    const updatedIngredients = currentIngredients.map(ing =>
      ing.inventoryItemId === inventoryItemId ? { ...ing, quantity } : ing
    );
    form.setValue("ingredients", updatedIngredients);
  };

  const handleIngredientUnitChange = (inventoryItemId: string, unit: string) => {
    const currentIngredients = form.getValues("ingredients") || [];
    const updatedIngredients = currentIngredients.map(ing =>
      ing.inventoryItemId === inventoryItemId ? { ...ing, unit } : ing
    );
    form.setValue("ingredients", updatedIngredients);
  };

  const onSubmit = async (data: MenuItemFormValues) => {
    setIsSubmitting(true);
    try {
      const formattedData = {
        ...data,
        price: Number(data.price),
        cost: Number(data.cost) || 0,
        taxRate: Number(data.taxRate) || 0,
        branchName: isAdmin ? data.branchName : normalizeBranchName(user?.branch || ""),
        modifiers: {
          connect: data.modifiers.map(({ id }) => ({ id }))
        },
        ingredients: {
          create: data.ingredients.map(ing => ({
            inventoryItemId: ing.inventoryItemId,
            quantity: ing.quantity,
            unit: ing.unit
          }))
        }
      };

      if (isEditMode && initialData?.id) {
        await menuItemApi.updateItem(initialData.id, formattedData);
        toast({
          title: "Success",
          description: "Menu item updated successfully.",
        });
      } else {
        await menuItemApi.createItem(formattedData);
        toast({
          title: "Success",
          description: "Menu item created successfully.",
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error saving menu item:", error);
      toast({
        title: "Error",
        description: "Failed to save menu item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter item name" {...field} />
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
                    placeholder="Enter item description"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <ImageUpload
                    value={field.value ? [field.value] : []}
                    disabled={isSubmitting}
                    onChange={(url) => field.onChange(url)}
                    onRemove={() => field.onChange("")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
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
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No categories found. Please create a category first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
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
                  <FormLabel>Branch</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.name}>
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

          {/* Ingredients Section */}
          <div className="space-y-4">
            <FormLabel className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Ingredients
            </FormLabel>
            <div className="space-y-2">
              {selectedIngredients.map((ingredient) => (
                <div
                  key={ingredient.inventoryItemId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium">{ingredient.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={ingredient.quantity}
                        onChange={(e) => 
                          handleIngredientQuantityChange(
                            ingredient.inventoryItemId, 
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8"
                      />
                      <Select
                        value={ingredient.unit}
                        onValueChange={(value) => 
                          handleIngredientUnitChange(ingredient.inventoryItemId, value)
                        }
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">
                        Stock: {ingredient.currentStock} {ingredient.unit}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(ingredient.inventoryItemId)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsIngredientDropdownOpen(!isIngredientDropdownOpen)}
                >
                  Add Ingredient
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isIngredientDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isIngredientDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search ingredients..."
                        value={ingredientSearchTerm}
                        onChange={(e) => setIngredientSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {filteredInventoryItems.length > 0 ? (
                        filteredInventoryItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
                            onClick={() => handleAddIngredient(item)}
                          >
                            <div>
                              <span>{item.name}</span>
                              <p className="text-sm text-muted-foreground">
                                Available: {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {ingredientSearchTerm
                            ? "No ingredients found."
                            : "No available ingredients."}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modifiers Section */}
          <div className="space-y-4">
            <FormLabel>Modifiers</FormLabel>
            <div className="space-y-2">
              {selectedModifiers.map((modifier) => (
                <div
                  key={modifier.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{modifier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${modifier.price.toFixed(2)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveModifier(modifier.id)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => setIsModifierDropdownOpen(!isModifierDropdownOpen)}
                >
                  Add Modifier
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${
                      isModifierDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isModifierDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search modifiers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <ScrollArea className="h-[200px]">
                      {filteredModifiers.length > 0 ? (
                        filteredModifiers.map((modifier) => (
                          <div
                            key={modifier.id}
                            className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
                            onClick={() => handleAddModifier(modifier)}
                          >
                            <span>{modifier.name}</span>
                            <span>${modifier.price.toFixed(2)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          {searchTerm
                            ? "No modifiers found."
                            : "No available modifiers."}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active</FormLabel>
                  <FormDescription>
                    This item will be visible to customers when active.
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

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => (onCancel ? onCancel() : router.back())}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Update" : "Create"} Item
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}