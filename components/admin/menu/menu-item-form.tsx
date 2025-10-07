// "use client";

// import * as React from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { toast } from "@/components/ui/use-toast";
// import {
//   Loader2,
//   Save,
//   X as XIcon,
//   ChevronDown,
//   ChevronUp,
//   Check,
//   Plus,
//   Package,
//   BarChart2,
//   Settings,
// } from "lucide-react";
// import { MenuItem, categoryApi, modifierApi, menuItemApi } from "@/lib/menu-api";
// import { ImageUpload } from "@/components/ui/image-upload";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Separator } from "@/components/ui/separator";
// import { useBranches } from "@/hooks/use-branches";
// import { useUser } from "@/hooks/use-user";

// // --- Zod Schema ---
// const menuItemFormSchema = z.object({
//   name: z.string().min(2, { message: "Name must be at least 2 characters." }),
//   description: z.string().optional(),
//   imageUrl: z.string().url().optional().or(z.literal("")),
//   price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
//   cost: z.coerce.number().min(0, { message: "Cost cannot be negative." }),
//   categoryId: z.string().optional(), // Made optional to handle managers without categories
//   branchName: z.string().min(1, { message: "Branch is required." }),
//   isActive: z.boolean().default(true),
//   taxRate: z.number().min(0).default(0),
//   taxExempt: z.boolean().default(false),
//   tags: z.array(z.string()).default([]),
//   modifiers: z
//     .array(
//       z.object({
//         id: z.string(),
//         name: z.string(),
//         price: z.number(),
//         isActive: z.boolean(),
//         options: z.array(z.string()).default([]),
//         minSelection: z.number().default(0),
//         maxSelection: z.number().default(0),
//         type: z.string().default("SINGLE"),
//       })
//     )
//     .default([]),
//   createdAt: z.string().optional(),
//   updatedAt: z.string().optional(),
// });

// type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

// interface MenuItemFormProps {
//   initialData?: MenuItem;
//   onSuccess?: () => void;
//   onCancel?: () => void;
// }

// export function MenuItemForm({ initialData, onSuccess, onCancel }: MenuItemFormProps) {
//   const [isLoading, setIsLoading] = React.useState(false);
//   const [isSubmitting, setIsSubmitting] = React.useState(false);
//   const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
//   const [allModifiers, setAllModifiers] = React.useState<{ id: string; name: string; price: number; isActive?: boolean }[]>([]);
//   const [isModifierDropdownOpen, setIsModifierDropdownOpen] = React.useState(false);
//   const [searchTerm, setSearchTerm] = React.useState("");
//   const [showCategoryHelp, setShowCategoryHelp] = React.useState(false);
// console.log(allModifiers,"allModifiers")
//   const router = useRouter();
//   const { branches, loading: branchesLoading, error: branchesError } = useBranches();
//   const { user, isAdmin } = useUser();
  
//   const isEditMode = !!initialData;

//   // Helper function to normalize branch names
//   const normalizeBranchName = (branch: string): string => {
//     if (!branch) return "";
//     if (branch.startsWith('branch')) {
//       return branch
//         .replace('branch1', 'Bradford')
//         .replace('branch2', 'Leeds')
//         .replace('branch3', 'Helifax')
//         .replace('branch4', 'Darley St Market')
//     }
//     return branch; // Already in new format
//   };

//   const defaultValues = React.useMemo(() => {
//     // Initialize default values for a new item
//     const baseValues = {
//       name: "",
//       description: "",
//       imageUrl: "",
//       price: 0,
//       cost: 0,
//       branchName: normalizeBranchName(user?.branch || ""),
//       isActive: true,
//       taxRate: 0,
//       taxExempt: false,
//       tags: [],
//       modifiers: [],
//       categoryId: ""
//     };

//     // If no initial data, return the base values
//     if (!initialData) {
//       return baseValues;
//     }

//     console.log('Initial data:', initialData);
//     console.log('All modifiers:', allModifiers);

//     // Process modifiers from initialData
//     let modifiers: Array<{ id: string; name: string; price: number; isActive: boolean }> = [];
    
//     // Check if we have modifiers data in the initialData
//     if (initialData.modifiers) {
//       console.log('Initial data modifiers:', initialData.modifiers);
      
//       // Handle case where modifiers is an array of modifier objects
//       if (Array.isArray(initialData.modifiers)) {
//         console.log('Modifiers is an array');
//         modifiers = initialData.modifiers
//           .filter(modifier => modifier && typeof modifier === 'object' && 'id' in modifier)
//           .map(modifier => {
//             const fullModifier = allModifiers.find(m => m.id === modifier.id) || modifier;
//             return {
//               id: modifier.id,
//               name: fullModifier?.name || modifier.name || '',
//               price: typeof fullModifier?.price === 'number' ? fullModifier.price : 
//                      typeof modifier.price === 'number' ? modifier.price : 0,
//               isActive: fullModifier?.isActive ?? modifier.isActive ?? true,
//             };
//           });
//       } 
//       // Handle case where modifiers is in Prisma connect format
//       else if (initialData.modifiers.connect && Array.isArray(initialData.modifiers.connect)) {
//         console.log('Modifiers is in connect format');
//         modifiers = initialData.modifiers.connect
//           .filter((item: any) => item && item.id)
//           .map(({ id }: { id: string }) => {
//             const fullModifier = allModifiers.find(m => m.id === id);
//             if (!fullModifier) {
//               console.warn(`Modifier with ID ${id} not found in allModifiers`);
//               return null;
//             }
//             return {
//               id,
//               name: fullModifier.name || '',
//               price: fullModifier.price || 0,
//               isActive: fullModifier.isActive ?? true,
//             };
//           })
//           .filter((m): m is NonNullable<typeof m> => m !== null);
//       }
      
//       console.log('Processed modifiers:', modifiers);
//     }

//     // Return the complete values with initial data
//     return {
//       ...baseValues, // Start with base values
//       ...initialData, // Spread initial data to override base values
//       modifiers, // Use processed modifiers
//     };
//   }, [initialData, user?.branch, categories, allModifiers]);

//   const form = useForm<MenuItemFormValues>({
//     resolver: zodResolver(menuItemFormSchema),
//     defaultValues,
//   });

//   React.useEffect(() => {
//     console.log('Resetting form with values:', defaultValues);
//     console.log('Form values before reset:', form.getValues());
    
//     // Reset the form with the new default values
//     form.reset(defaultValues);
    
//     // If we have initial data with modifiers, ensure they're properly set in the form
//     if (defaultValues.modifiers && defaultValues.modifiers.length > 0) {
//       console.log('Setting modifiers in form:', defaultValues.modifiers);
//       // Ensure we have the full modifier data
//       const modifiersWithData = defaultValues.modifiers.map(mod => {
//         const fullModifier = allModifiers.find(m => m.id === mod.id) || mod;
//         return {
//           id: mod.id,
//           name: fullModifier.name || mod.name || `Modifier ${mod.id}`,
//           price: fullModifier.price || mod.price || 0,
//           isActive: fullModifier.isActive ?? mod.isActive ?? true
//         };
//       });
      
//       form.setValue('modifiers', modifiersWithData, { 
//         shouldDirty: false, 
//         shouldValidate: true 
//       });
//     }
    
//     // Log the form state after reset
//     setTimeout(() => {
//       console.log('Form values after reset:', form.getValues());
//     }, 100);
//   }, [defaultValues, form, allModifiers]);

//   React.useEffect(() => {
//     if (!isAdmin && categories.length === 0 && !isLoading) {
//       setShowCategoryHelp(true);
//     } else {
//       setShowCategoryHelp(false);
//     }
//   }, [categories, isLoading, isAdmin]);

//   const filteredModifiers = React.useMemo(
//     () =>
//       allModifiers.filter((modifier) =>
//         modifier.name.toLowerCase().includes(searchTerm.toLowerCase())
//       ),
//     [allModifiers, searchTerm]
//   );

//   const selectedModifiers = React.useMemo(() => {
//     try {
//       const formModifiers = form.getValues("modifiers");
//       console.log('Form modifiers from getValues:', formModifiers);
      
//       if (!formModifiers || !Array.isArray(formModifiers)) {
//         console.log('No valid form modifiers found');
//         return [];
//       }
      
//       // Get all modifier IDs from the form
//       const selectedIds = formModifiers.map(m => m?.id).filter(Boolean);
//       console.log('Selected modifier IDs:', selectedIds);
      
//       if (selectedIds.length === 0) {
//         console.log('No selected modifier IDs found');
//         return [];
//       }
      
//       console.log('All available modifiers:', allModifiers);
      
//       // Map through the selected IDs and find the corresponding modifier data
//       const filteredModifiers = selectedIds.map(id => {
//         const modifier = allModifiers.find(m => m && m.id === id);
//         if (!modifier) {
//           console.warn(`Modifier with ID ${id} not found in allModifiers`);
//           return null;
//         }
//         return {
//           id: modifier.id,
//           name: modifier.name || `Modifier ${modifier.id}`,
//           price: modifier.price || 0,
//           isActive: modifier.isActive !== false
//         };
//       }).filter((m): m is NonNullable<typeof m> => m !== null);
      
//       console.log('Filtered selected modifiers:', filteredModifiers);
//       return filteredModifiers;
//     } catch (error) {
//       console.error('Error getting selected modifiers:', error);
//       return [];
//     }
//   }, [allModifiers, form.watch("modifiers")]);

//   React.useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         // For managers, we need to get categories from their branch with normalized branch name
//         // For admins, get all categories
//         const categoriesParams = isAdmin ? {} : { branchName: normalizeBranchName(user?.branch || "") };
//         console.log('Fetching categories with params:', categoriesParams);
//         console.log('User branch (raw):', user?.branch);
//         console.log('User branch (normalized):', normalizeBranchName(user?.branch || ""));

//         const [categoriesRes, modifiersRes] = await Promise.all([
//           categoryApi.getCategories(categoriesParams),
//           modifierApi.getModifiers(),
//         ]);
// console.log(modifiersRes,"modifiersRes")
//         console.log("Categories API response:", categoriesRes);
//         console.log("Categories data:", categoriesRes?.data?.data);
//         const categoriesData = Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [];
//         setCategories(categoriesData);
//         console.log("Categories set:", categoriesData);

//         // If manager gets no categories, show a helpful message
//         if (!isAdmin && categoriesData.length === 0) {
//           console.log('Manager has no categories in their branch, they need to create one first');
//         }

//         setAllModifiers(
//           Array.isArray(modifiersRes?.data?.data)
//             ? modifiersRes.data.data.map((m: any) => ({
//                 id: m.id,
//                 name: m.name,
//                 price: m.price || 0,
//                 isActive: m.isActive ?? true,
//               }))
//             : []
//         );
//       } catch (error) {
//         console.error("Error loading data:", error);
//         toast({
//           title: "Error",
//           description: "Failed to load required data. Please try again.",
//           variant: "destructive",
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, [user, isAdmin]);

//   const onSubmit = async (data: MenuItemFormValues) => {
//     setIsSubmitting(true);
//     try {
//       console.log('Form submission started with data:', data);
//       console.log('User info:', { isAdmin, userBranch: user?.branch });

//       // Validate required fields
//       if (!data.categoryId || data.categoryId === "no-categories") {
//         // For managers: if they have categories available, category is required
//         // For managers: if they have no categories, allow empty categoryId (they need to create categories first)
//         if (!isAdmin && categories.length > 0) {
//           toast({
//             title: "Error",
//             description: "Please select a category.",
//             variant: "destructive",
//           });
//           setIsSubmitting(false);
//           return;
//         }
//         // For managers with no categories, we'll create the item without a category
//         // This allows them to create items and then create categories later
//       }

//       // Ensure modifiers is always an array
//       const modifiers = Array.isArray(data.modifiers) ? data.modifiers : [];
//       console.log('Raw modifiers from form:', modifiers);
      
//       // Format the modifiers to match the expected Prisma connect format
//       // The backend expects: { connect: [{ id: '1' }, { id: '2' }] }
//       const formattedModifiers = modifiers.length > 0 ? {
//         connect: modifiers
//           .filter(m => m && typeof m === 'object' && 'id' in m)
//           .map(({ id }) => ({
//             id: String(id) // Just need the id for the connect operation
//           }))
//       } : undefined;
      
//       console.log('Formatted modifiers for API:', formattedModifiers);
      
//       const apiData = {
//         name: data.name,
//         description: data.description,
//         imageUrl: data.imageUrl || null,
//         price: Number(data.price),
//         cost: Number(data.cost) || 0,
//         categoryId: data.categoryId,
//         branchName: isAdmin ? data.branchName : normalizeBranchName(user?.branch || ""),
//         isActive: data.isActive !== undefined ? data.isActive : true,
//         taxRate: Number(data.taxRate) || 0,
//         taxExempt: data.taxExempt || false,
//         tags: data.tags || [],
//         ...(formattedModifiers && { modifiers: formattedModifiers }),
//       };

//       console.log('Sending API data:', apiData);
//       console.log('Normalized branch name:', normalizeBranchName(user?.branch || ""));

//       if (isEditMode && initialData?.id) {
//         await menuItemApi.updateItem(initialData.id, apiData as any);
//         toast({ title: "Success", description: "Menu item updated successfully." });
//       } else {
//         await menuItemApi.createItem(apiData as any);
//         toast({ title: "Success", description: "Menu item created successfully." });
//       }
//       router.refresh();
//       router.push("/dashboard/menu/items");
//       onSuccess?.();
//     } catch (error) {
//       console.error("Error saving menu item:", error);
//       toast({
//         title: "Error",
//         description:
//           error instanceof Error ? error.message : "Failed to save menu item.",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const toggleModifier = (modifierId: string) => {
//     const modifier = allModifiers.find((m) => m.id === modifierId);
//     if (!modifier) return;

//     const currentModifiers = form.getValues("modifiers") || [];
//     const modifierIndex = currentModifiers.findIndex((m) => m.id === modifierId);

//     if (modifierIndex >= 0) {
//       const newModifiers = [...currentModifiers];
//       newModifiers.splice(modifierIndex, 1);
//       form.setValue("modifiers", newModifiers);
//     } else {
//       form.setValue("modifiers", [
//         ...currentModifiers,
//         {
//           id: modifier.id,
//           name: modifier.name,
//           price: modifier.price || 0,
//           isActive: true,
//         },
//       ]);
//     }
//   };

//   const removeModifier = (modifierId: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     const currentModifiers = form.getValues("modifiers")?.filter((m) => m.id !== modifierId) || [];
//     form.setValue("modifiers", currentModifiers);
//   };

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center p-8">
//         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         <span className="ml-2 text-muted-foreground">Loading menu item data...</span>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold tracking-tight">
//               {isEditMode ? "Edit Menu Item" : "Create New Menu Item"}
//             </h2>
//           </div>

//           {/* Basic Information */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h3 className="text-lg font-medium flex items-center mb-4">
//               <span className="bg-blue-100 p-1.5 rounded-lg mr-3">
//                 <Package className="h-5 w-5 text-blue-600" />
//               </span>
//               Basic Information
//             </h3>
//             <div className="space-y-4 md:pl-9">
//               <FormField
//                 control={form.control}
//                 name="imageUrl"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Item Image</FormLabel>
//                     <FormControl>
//                       <div className="w-full max-w-md">
//                         <ImageUpload
//                           value={field.value || ""}
//                           onChange={(url) => field.onChange(url)}
//                           onRemove={() => field.onChange("")}
//                           disabled={isLoading || isSubmitting}
//                           aspectRatio={4 / 3}
//                         />
//                       </div>
//                     </FormControl>
//                     <FormMessage />
//                     <FormDescription>
//                       Upload a high-quality image of your menu item (JPG, PNG, or WebP).
//                     </FormDescription>
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="name"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Name *</FormLabel>
//                     <FormControl>
//                       <Input placeholder="e.g., Margherita Pizza" {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="description"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Description</FormLabel>
//                     <FormControl>
//                       <Textarea placeholder="A delicious pizza..." {...field} />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="categoryId"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Category *</FormLabel>
//                     <Select
//                       onValueChange={field.onChange}
//                       defaultValue={field.value}
//                     >
//                       <FormControl>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select a category" />
//                         </SelectTrigger>
//                       </FormControl>
//                       <SelectContent>
//                         {(() => {
//                           console.log("Rendering categories dropdown with:", categories);
//                           return categories.length === 0 ? (
//                             <SelectItem disabled value="no-categories">
//                               {isAdmin
//                                 ? "No categories available"
//                                 : `No categories found for ${user?.branch} branch. Create a category first.`
//                               }
//                             </SelectItem>
//                           ) : (
//                             categories.map((c) => (
//                               <SelectItem key={c.id} value={c.id}>
//                                 {c.name}
//                               </SelectItem>
//                             ))
//                           );
//                         })()}
//                       </SelectContent>
//                     </Select>
//                     <FormMessage />
//                     {showCategoryHelp && (
//                       <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
//                         <p className="text-sm text-blue-800">
//                           💡 <strong>Need to create a category first?</strong>
//                         </p>
//                         <p className="text-sm text-blue-700 mt-1">
//                           Go to <strong>Menu → Categories → Add Category</strong> to create a category for your branch first.
//                         </p>
//                       </div>
//                     )}
//                   </FormItem>
//                 )}
//               />
//               {isAdmin && (
//                 <FormField
//                   control={form.control}
//                   name="branchName"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Branch *</FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         defaultValue={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select a branch" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           {branches.map((branch) => (
//                             <SelectItem key={branch.value} value={branch.value}>
//                               {branch.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />
//               )}
//             </div>
//           </div>

//           {/* Pricing & Details */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h3 className="text-lg font-medium flex items-center mb-4">
//               <span className="bg-green-100 p-1.5 rounded-lg mr-3">
//                 <BarChart2 className="h-5 w-5 text-green-600" />
//               </span>
//               Pricing & Details
//             </h3>
//             <div className="space-y-4 md:pl-9 grid grid-cols-2 gap-4">
//               <FormField
//                 control={form.control}
//                 name="price"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Price *</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="number"
//                         step="0.01"
//                         placeholder="0.00"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               <FormField
//                 control={form.control}
//                 name="cost"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Cost</FormLabel>
//                     <FormControl>
//                       <Input
//                         type="number"
//                         step="0.01"
//                         placeholder="0.00"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//               {!form.watch('taxExempt') && (
//                <FormField
//                control={form.control}
//                name="taxRate"
//                render={({ field }) => (
//                  <FormItem>
//                    <FormLabel>Tax Rate</FormLabel>
//                    <Select
//                      onValueChange={(value) => field.onChange(Number(value))}
//                      value={field.value.toString()}
//                    >
//                      <FormControl>
//                        <SelectTrigger>
//                          <SelectValue placeholder="Select tax rate" />
//                        </SelectTrigger>
//                      </FormControl>
//                      <SelectContent>
//                        <SelectItem value="0">0%</SelectItem>
//                        <SelectItem value="20">20%</SelectItem>
//                      </SelectContent>
//                    </Select>
//                    <FormMessage />
//                  </FormItem>
//                )}
//              />
//               )}
//               {/* <FormField
//                 control={form.control}
//                 name="taxExempt"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <FormLabel>Tax Exempt</FormLabel>
//                       <FormDescription>Item is exempt from tax</FormDescription>
//                     </div>
//                     <FormControl>
//                       <Switch
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               /> */}
//               <FormField
//                 control={form.control}
//                 name="tags"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Tags</FormLabel>
//                     <FormControl>
//                       <Input
//                         value={field.value.join(", ")}
//                         onChange={(e) =>
//                           field.onChange(e.target.value.split(",").map((t) => t.trim()))
//                         }
//                         placeholder="Separate tags with commas"
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//           </div>

//           {/* Modifiers */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h3 className="text-lg font-medium flex items-center mb-4">
//               <span className="bg-purple-100 p-1.5 rounded-lg mr-3">
//                 <Plus className="h-5 w-5 text-purple-600" />
//               </span>
//               Modifiers
//             </h3>
//             <div className="pl-9">
//               <FormField
//                 control={form.control}
//                 name="modifiers"
//                 render={() => (
//                   <FormItem>
//                     {selectedModifiers.length > 0 && (
//                       <div className="flex flex-wrap gap-2 mb-4">
//                         {selectedModifiers.map((mod) => (
//                           <Badge
//                             key={mod.id}
//                             variant="secondary"
//                             className="pl-3 pr-1 py-1 text-sm flex items-center gap-1"
//                           >
//                             {mod.name}
//                             <button
//                               type="button"
//                               onClick={(e) => removeModifier(mod.id, e)}
//                               className="ml-1 p-0.5 rounded-full hover:bg-gray-200"
//                             >
//                               <XIcon className="h-3.5 w-3.5" />
//                             </button>
//                           </Badge>
//                         ))}
//                       </div>
//                     )}
//                     <div className="relative">
//                       <button
//                         type="button"
//                         onClick={() =>
//                           setIsModifierDropdownOpen(!isModifierDropdownOpen)
//                         }
//                         className="flex w-full justify-between rounded-md border px-3 py-2 text-sm"
//                       >
//                         <span>
//                           {selectedModifiers.length
//                             ? `${selectedModifiers.length} selected`
//                             : "Select modifiers..."}
//                         </span>
//                         {isModifierDropdownOpen ? (
//                           <ChevronUp className="h-4 w-4 opacity-50" />
//                         ) : (
//                           <ChevronDown className="h-4 w-4 opacity-50" />
//                         )}
//                       </button>
//                       {isModifierDropdownOpen && (
//                         <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
//                           <div className="p-2">
//                             <Input
//                               placeholder="Search modifiers..."
//                               value={searchTerm}
//                               onChange={(e) => setSearchTerm(e.target.value)}
//                               className="h-8 text-sm mb-1"
//                             />
//                           </div>
//                           <Separator />
//                           <ScrollArea className="max-h-60 overflow-auto">
//                             {filteredModifiers.length ? (
//                               filteredModifiers.map((mod) => {
//                                 const isSelected = form
//                                   .getValues("modifiers")
//                                   ?.some((m) => m.id === mod.id);
//                                 return (
//                                   <div
//                                     key={mod.id}
//                                     onClick={() => toggleModifier(mod.id)}
//                                     className={`flex cursor-pointer items-center px-2 py-1.5 text-sm ${
//                                       isSelected ? "bg-accent" : ""
//                                     }`}
//                                   >
//                                     <span className="mr-2">
//                                       {isSelected ? (
//                                         <Check className="h-4 w-4 text-primary" />
//                                       ) : (
//                                         <div className="h-4 w-4 border rounded border-muted-foreground/50" />
//                                       )}
//                                     </span>
//                                     {mod.name}
//                                   </div>
//                                 );
//                               })
//                             ) : (
//                               <div className="py-6 text-center text-sm text-muted-foreground">
//                                 No modifiers found
//                               </div>
//                             )}
//                           </ScrollArea>
//                         </div>
//                       )}
//                     </div>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </div>
//           </div>

//           {/* Status */}
//           <div className="bg-white p-6 rounded-lg shadow-sm border">
//             <h3 className="text-lg font-medium flex items-center mb-4">
//               <span className="bg-gray-100 p-1.5 rounded-lg mr-3">
//                 <Settings className="h-5 w-5 text-gray-600" />
//               </span>
//               Status
//             </h3>
//             <div className="space-y-4 pl-9">
//               <FormField
//                 control={form.control}
//                 name="isActive"
//                 render={({ field }) => (
//                   <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
//                     <div className="space-y-0.5">
//                       <FormLabel>Active</FormLabel>
//                       <FormDescription>Item is active and visible</FormDescription>
//                     </div>
//                     <FormControl>
//                       <Switch
//                         checked={field.value}
//                         onCheckedChange={field.onChange}
//                       />
//                     </FormControl>
//                   </FormItem>
//                 )}
//               />
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="flex justify-end space-x-4 pt-4 border-t">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={onCancel || (() => router.back())}
//               disabled={isSubmitting}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="submit"
//               disabled={isSubmitting || isLoading}
//               className="min-w-[100px]"
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   {isEditMode ? "Updating..." : "Creating..."}
//                 </>
//               ) : (
//                 <>
//                   <Save className="mr-2 h-4 w-4" />
//                   {isEditMode ? "Update" : "Create"}
//                 </>
//               )}
//             </Button>
//           </div>
//         </form>
//       </Form>
//     </div>
//   );
// }

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
import { useBranches } from "@/hooks/use-branches";
import { useUser } from "@/hooks/use-user";

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
    id: string; 
    name: string; 
    price: number; 
    isActive?: boolean 
  }[]>([]);
  const [isModifierDropdownOpen, setIsModifierDropdownOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showCategoryHelp, setShowCategoryHelp] = React.useState(false);
  
  const router = useRouter();
  const { branches, loading: branchesLoading, error: branchesError } = useBranches();
  const { user, isAdmin } = useUser();
  
  const isEditMode = !!initialData;

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

    return {
      ...initialData,
      modifiers
    };
  }, [initialData, user?.branch]);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues,
  });

  // Reset form when initialData or allModifiers changes
  React.useEffect(() => {
    if (initialData?.modifiers && allModifiers.length > 0) {
      const formattedModifiers = initialData.modifiers
        .filter(mod => mod && mod.modifier)
        .map(mod => {
          const fullModifier = allModifiers.find(m => m.id === mod.modifier.id) || mod.modifier;
          return {
            id: fullModifier.id,
            name: fullModifier.name || `Modifier ${fullModifier.id}`,
            price: fullModifier.price || 0,
            isActive: fullModifier.isActive !== false,
            type: fullModifier.type || "SINGLE"
          };
        });

      form.reset({
        ...initialData,
        modifiers: formattedModifiers
      });
    }
  }, [initialData, allModifiers, form]);

  // Fetch categories and modifiers
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const categoriesParams = isAdmin ? {} : { 
          branchName: normalizeBranchName(user?.branch || "") 
        };

        const [categoriesRes, modifiersRes] = await Promise.all([
          categoryApi.getCategories(categoriesParams),
          modifierApi.getModifiers(),
        ]);

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

  const filteredModifiers = React.useMemo(() => {
    return allModifiers.filter(
      modifier => 
        modifier.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedModifiers.some(selected => selected.id === modifier.id)
    );
  }, [allModifiers, searchTerm, selectedModifiers]);

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