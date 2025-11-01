// // "use client";

// // import * as React from "react";
// // import { useForm } from "react-hook-form";
// // import { zodResolver } from "@hookform/resolvers/zod";
// // import * as z from "zod";
// // import { useRouter } from "next/navigation";
// // import { Button } from "@/components/ui/button";
// // import {
// //   Form,
// //   FormControl,
// //   FormDescription,
// //   FormField,
// //   FormItem,
// //   FormLabel,
// //   FormMessage,
// // } from "@/components/ui/form";
// // import { Input } from "@/components/ui/input";
// // import { Textarea } from "@/components/ui/textarea";
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select";
// // import { Switch } from "@/components/ui/switch";
// // import { toast } from "@/components/ui/use-toast";
// // import {
// //   Loader2,
// //   Save,
// //   X as XIcon,
// //   ChevronDown,
// //   ChevronUp,
// //   Check,
// //   Plus,
// //   Package,
// //   BarChart2,
// //   Settings,
// //   ChefHat,
// // } from "lucide-react";
// // import { MenuItem, categoryApi, modifierApi, menuItemApi } from "@/lib/menu-api";
// // import  { inventoryItemApi } from "@/lib/inventory-api";
// // import { restaurantApi } from "@/lib/restaurant-api";
// // import { branchApi } from "@/lib/branch-api";
// // import { ImageUpload } from "@/components/ui/image-upload";
// // import { Badge } from "@/components/ui/badge";
// // import { ScrollArea } from "@/components/ui/scroll-area";
// // import { Separator } from "@/components/ui/separator";
// // import { useBranches } from "@/hooks/use-branches";
// // import { useUser } from "@/hooks/use-user";

// // const units = ["kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"];

// // const menuItemFormSchema = z.object({
// //   name: z.string().min(2, { message: "Name must be at least 2 characters." }),
// //   description: z.string().optional(),
// //   imageUrl: z.string().url().optional().or(z.literal("")),
// //   price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
// //   cost: z.coerce.number().min(0, { message: "Cost cannot be negative." }),
// //   categoryId: z.string().optional(),
// //   branchName: z.string().min(1, { message: "Branch is required." }),
// //   restaurantId: z.string().min(1, { message: "Restaurant is required." }),
// //   isActive: z.boolean().default(true),
// //   taxRate: z.number().min(0).default(0),
// //   taxExempt: z.boolean().default(false),
// //   tags: z.array(z.string()).default([]),
// //   modifiers: z
// //     .array(
// //       z.object({
// //         id: z.string(),
// //         name: z.string(),
// //         price: z.number(),
// //         isActive: z.boolean(),
// //         options: z.array(z.string()).default([]),
// //         minSelection: z.number().default(0),
// //         maxSelection: z.number().default(0),
// //         type: z.string().default("SINGLE"),
// //       })
// //     )
// //     .default([]),
// //   ingredients: z
// //     .array(
// //       z.object({
// //         inventoryItemId: z.string(),
// //         name: z.string(),
// //         quantity: z.number().min(0.01, { message: "Quantity must be greater than 0" }),
// //         unit: z.string(),
// //         currentStock: z.number().optional(),
// //       })
// //     )
// //     .default([]),
// //   createdAt: z.string().optional(),
// //   updatedAt: z.string().optional(),
// // });

// // type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

// // interface MenuItemFormProps {
// //   initialData?: MenuItem;
// //   onSuccess?: () => void;
// //   onCancel?: () => void;
// // }

// // export function MenuItemForm({ initialData, onSuccess, onCancel }: MenuItemFormProps) {
// //   const [isLoading, setIsLoading] = React.useState(false);
// //   const [isSubmitting, setIsSubmitting] = React.useState(false);
// //   const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
// //   const [allModifiers, setAllModifiers] = React.useState<{
// //     type: string; 
// //     id: string; 
// //     name: string; 
// //     price: number; 
// //     isActive?: boolean 
// //   }[]>([]);
// //   const [restaurants, setRestaurants] = React.useState<{ id: string; name: string }[]>([]);
// //   const [filteredBranches, setFilteredBranches] = React.useState<{ id: string; name: string }[]>([]);
// //   const [inventoryItems, setInventoryItems] = React.useState<{
// //     id: string;
// //     name: string;
// //     quantity: number;
// //     unit: string;
// //     branchName?: string;
// //   }[]>([]);
// //   const [isModifierDropdownOpen, setIsModifierDropdownOpen] = React.useState(false);
// //   const [isIngredientDropdownOpen, setIsIngredientDropdownOpen] = React.useState(false);
// //   const [searchTerm, setSearchTerm] = React.useState("");
// //   const [ingredientSearchTerm, setIngredientSearchTerm] = React.useState("");
// //   const [showCategoryHelp, setShowCategoryHelp] = React.useState(false);
// //   const [formInitialized, setFormInitialized] = React.useState(false);
// //   const router = useRouter();
// //   const { user, isAdmin } = useUser();

// //   // Get manager's branch and restaurant from user profile
// //   const managerBranch = React.useMemo(() => {
// //     if (user?.branch && typeof user.branch === 'object') {
// //       return {
// //         id: user.branch.id || '',
// //         name: user.branch.name || '',
// //         address: user.branch.address || '',
// //         phone: user.branch.phone || '',
// //         // Add restaurantId if available in the branch object
// //         restaurantId: (user.branch as any).restaurantId || ''
// //       };
// //     }
// //     return null;
// //   }, [user?.branch]);

// //   // Load branches, filtered by manager's branch if not admin
// //   const { branches = [], loading: branchesLoading, error: branchesError } = useBranches({
// //     filterByBranchName: isAdmin ? undefined : (managerBranch?.name || '')
// //   });

// //   const isEditMode = !!initialData;

// //   // Get the manager's restaurant ID from the user's branch or branches list
// //   const managerRestaurantId = React.useMemo(() => {
// //     // If we have a restaurant ID from the branch, use that
// //     if (managerBranch?.restaurantId) {
// //       return managerBranch.restaurantId;
// //     }
// //     // Otherwise try to get it from the branches list
// //     if (branches.length > 0 && branches[0]?.restaurantId) {
// //       return branches[0].restaurantId;
// //     }
// //     return '';
// //   }, [managerBranch, branches]);

// //   // Normalize branch name for display
// //   const normalizeBranchName = React.useCallback((branch: string | { name: string } | null | undefined): string => {
// //     if (!branch) return '';
// //     const branchName = typeof branch === 'string' ? branch : branch.name;
// //     if (!branchName) return '';

// //     if (branchName.startsWith('branch')) {
// //       return branchName
// //         .replace('branch1', 'Bradford')
// //         .replace('branch2', 'Leeds')
// //         .replace('branch3', 'Helifax')
// //         .replace('branch4', 'Darley St Market');
// //     }
// //     return branchName;
// //   }, []);

// //   // Set default values based on manager's branch and restaurant
// //   const defaultValues = React.useMemo(() => {
// //     // For manager, always use their assigned restaurant/branch
// //     const managerRestaurant = user?.restaurant;
// //     const managerBranchName = user?.branch;

// //     // Use initialData values if in edit mode, otherwise use manager's branch/restaurant
// //     const baseValues = {
// //       name: initialData?.name || "",
// //       description: initialData?.description || "",
// //       imageUrl: initialData?.imageUrl || "",
// //       price: initialData?.price || 0,
// //       cost: initialData?.cost || 0,
// //       categoryId: initialData?.categoryId || "",
// //       branchName: initialData?.branchName || (user?.role === 'MANAGER' && managerBranchName) || "",
// //       restaurantId: initialData?.restaurantId || (user?.role === 'MANAGER' && managerRestaurant?.id) || "",
// //       isActive: initialData?.isActive ?? true,
// //       taxRate: initialData?.taxRate || 0,
// //       taxExempt: initialData?.taxExempt || false,
// //       tags: initialData?.tags || [],
// //       modifiers: initialData?.modifiers || [],
// //       ingredients: initialData?.ingredients || [],
// //       createdAt: initialData?.createdAt || new Date().toISOString(),
// //       updatedAt: initialData?.updatedAt || new Date().toISOString(),
// //     };

// //     console.log('Form default values:', {
// //       ...baseValues,
// //       userRole: user?.role,
// //       managerRestaurant,
// //       managerBranchName
// //     });

// //     return baseValues;
// //   }, [initialData, managerBranch?.name, managerRestaurantId, user]);

// //   const form = useForm<MenuItemFormValues>({
// //     resolver: zodResolver(menuItemFormSchema),
// //     defaultValues,
// //   });

// //   // Debug defaultValues
// //   React.useEffect(() => {
// //     console.log('Form defaultValues:', defaultValues);
// //   }, [defaultValues]);

// //   // Reset form when initialData, allModifiers, or restaurants change (for edit mode)
// //   React.useEffect(() => {
// //     if (initialData && isEditMode) {
// //       // For edit mode, we need either restaurants to be loaded OR the form to be initialized with correct values
// //       const restaurantId = initialData.restaurantId || initialData.branch?.restaurantId;
// //       const hasRestaurant = restaurants.length > 0 || restaurantId;
// //       const hasModifiers = allModifiers.length > 0;

// //       console.log('Form reset check:', {
// //         hasRestaurant,
// //         hasModifiers,
// //         restaurantsLength: restaurants.length,
// //         allModifiersLength: allModifiers.length,
// //         restaurantId,
// //         initialDataRestaurantId: initialData.restaurantId,
// //         branchRestaurantId: initialData.branch?.restaurantId,
// //         formInitialized
// //       });

// //       // Early reset with basic data if we have the essential information and form isn't initialized yet
// //       if (!formInitialized && initialData.name) {
// //         console.log('Early form reset with basic data');
// //         const branchName = initialData.branchName || initialData.branch?.name || "";
// //         const categoryId = initialData.categoryId || initialData.category?.id || "";

// //         form.reset({
// //           ...initialData,
// //           restaurantId: initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id || "",
// //           branchName: branchName,
// //           categoryId: categoryId
// //         });
// //         setFormInitialized(true);

// //         console.log('Early form reset completed with:', {
// //           restaurantId: initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id || "",
// //           branchName: branchName,
// //           categoryId: categoryId
// //         });
// //       }

// //       // Full reset with formatted data when we have restaurants and modifiers loaded
// //       if (hasRestaurant && hasModifiers && formInitialized) {
// //         console.log('Full form reset with formatted data');
// //         const formattedModifiers = initialData.modifiers
// //           ?.filter(mod => mod && mod.modifier)
// //           .map(mod => {
// //             const fullModifier = allModifiers.find(m => m.id === mod.modifier.id) || mod.modifier;
// //             return {
// //               id: fullModifier.id,
// //               name: fullModifier.name || `Modifier ${fullModifier.id}`,
// //               price: fullModifier.price || 0,
// //               isActive: fullModifier.isActive !== false,
// //               type: fullModifier.type || "SINGLE"
// //             };
// //           }) || [];

// //         const formattedIngredients = initialData.ingredients
// //           ?.filter(ing => ing && ing.inventoryItem)
// //           .map(ing => ({
// //             inventoryItemId: ing.inventoryItem.id,
// //             name: ing.inventoryItem.name,
// //             quantity: ing.quantity || 0,
// //             unit: ing.unit || "pieces",
// //             currentStock: ing.inventoryItem.quantity
// //           })) || [];

// //         // Extract branch name and category ID for reset
// //         const branchName = initialData.branchName || initialData.branch?.name || "";
// //         const categoryId = initialData.categoryId || initialData.category?.id || "";

// //         form.reset({
// //           ...initialData,
// //           restaurantId: initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id || "",
// //           branchName: branchName,
// //           categoryId: categoryId,
// //           modifiers: formattedModifiers,
// //           ingredients: formattedIngredients
// //         });

// //         console.log('Full form reset completed with:', {
// //           restaurantId: initialData.restaurantId,
// //           branchName: branchName,
// //           categoryId: categoryId,
// //           modifiersCount: formattedModifiers.length,
// //           ingredientsCount: formattedIngredients.length
// //         });
// //       }
// //     }
// //   }, [initialData, allModifiers, restaurants, form, isEditMode, formInitialized]);

// //   // Fetch categories, modifiers, and inventory items
// //   React.useEffect(() => {
// //     const fetchData = async () => {
// //       setIsLoading(true);
// //       try {
// //         // Get current branch selection for modifier filtering
// //         const selectedBranchName = form.watch("branchName");
// //         const selectedRestaurantId = form.watch("restaurantId");

// //         // Prepare modifier API parameters
// //         const modifierParams: any = {};
// //         if (selectedBranchName && selectedBranchName !== "" && selectedBranchName !== "global") {
// //           // Find the branch ID from the selected branch name
// //           const selectedBranch = filteredBranches.find(branch => branch.name === selectedBranchName);
// //           if (selectedBranch) {
// //             modifierParams.branchId = selectedBranch.id;
// //           }
// //         } else if (selectedBranchName === "global") {
// //           // For global selection, don't filter by branch - load all modifiers
// //           // modifierParams will be empty, so all modifiers will be loaded
// //         }

// //         const [modifiersRes, inventoryRes] = await Promise.all([
// //           // categoryApi.getCategories(categoriesParams), // Don't load categories initially
// //           modifierApi.getModifiers(modifierParams), // Pass branch filtering
// //           inventoryItemApi.getItems(),
// //         ]);
// // console.log(inventoryRes,"inventryRes")
// //         // setCategories(Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : []); // Don't set categories initially

// //         const allModifiersData = Array.isArray(modifiersRes?.data?.data) 
// //           ? modifiersRes.data.data.map((m: any) => ({
// //               type: m.type || "SINGLE",
// //               id: m.id,
// //               name: m.name,
// //               price: m.price || 0,
// //               isActive: m.isActive ?? true,
// //             }))
// //           : [];

// //         setAllModifiers(allModifiersData);

// //         // Filter inventory items by branch for managers
// //         let inventoryData: any[] = [];
// //         if (inventoryRes?.data?.data && Array.isArray(inventoryRes.data.data)) {
// //           inventoryData = inventoryRes.data.data;
// //         } else if (Array.isArray(inventoryRes?.data)) {
// //           inventoryData = inventoryRes.data;
// //         } else {
// //           inventoryData = [];
// //         }
// //         console.log(inventoryData,"inventryData")
// //         if (!isAdmin && user?.branch) {
// //           const userBranch = normalizeBranchName(user.branch);
// //           if (Array.isArray(inventoryData)) {
// //             inventoryData = inventoryData.filter((item: any) => 
// //               item.branch === userBranch || item.branchName === userBranch
// //             );
// //           }
// //         }

// //         setInventoryItems(inventoryData.map((item: any) => ({
// //           id: item.id,
// //           name: item.name,
// //           quantity: item.quantity || 0,
// //           unit: item.unit || "pieces",
// //           branchName: item.branch || item.branchName
// //         })));

// //         // Only load restaurants if not in edit mode (for create mode)
// //         if (!isEditMode) {
// //           const restaurantsRes = await restaurantApi.getRestaurantsForDropdown();
// //           setRestaurants(Array.isArray(restaurantsRes?.data?.data) ? restaurantsRes.data.data : []);
// //         }

// //       } catch (error) {
// //         console.error("Error loading data:", error);
// //         toast({
// //           title: "Error",
// //           description: "Failed to load required data. Please try again.",
// //           variant: "destructive",
// //         });
// //       } finally {
// //         setIsLoading(false);
// //       }
// //     };

// //     fetchData();
// //   }, [user, isAdmin, isEditMode, form.watch("branchName"), filteredBranches]);

// //   // Fetch branches when restaurant is selected
// //   React.useEffect(() => {
// //     const selectedRestaurantId = form.watch("restaurantId");

// //     if (selectedRestaurantId) {
// //       branchApi.getBranchesByRestaurant(selectedRestaurantId).then((res) => {
// //         const restaurantBranches = Array.isArray(res?.data?.data) ? res.data.data : [];
// //         setFilteredBranches(restaurantBranches.map(branch => ({
// //           id: branch.id,
// //           name: branch.name
// //         })));
// //       }).catch((error) => {
// //         console.error("Error fetching branches for restaurant:", error);
// //         setFilteredBranches([]);
// //       });
// //     } else {
// //       setFilteredBranches([]);
// //     }
// //   }, [form.watch("restaurantId")]);

// //   // Filter branches based on selected restaurant and manager's access
//   React.useEffect(() => {
//     if (!form) return; // Ensure form is initialized

//     if (isAdmin) {
//       // For admin, show branches filtered by selected restaurant
//       const restaurantId = form.watch('restaurantId');
//       if (restaurantId) {
//         const filtered = branches.filter(
//           (branch) => branch.restaurantId === restaurantId
//         );
//         setFilteredBranches(filtered);

//         // If there's only one branch, select it
//         if (filtered.length === 1) {
//           form.setValue('branchName', filtered[0].name);
//         } else if (filtered.length === 0) {
//           // If no branches found for the selected restaurant, clear the branch selection
//           form.setValue('branchName', '');
//         }
//       } else {
//         // If no restaurant is selected, show no branches
//         setFilteredBranches([]);
//         form.setValue('branchName', '');
//       }
//     } else if (managerBranch) {
//       // For non-admin, only show their assigned branch
//       const branch = branches.find(b => b.id === managerBranch.id || b.name === managerBranch.name);
//       if (branch) {
//         setFilteredBranches([branch]);
//         // Set the branch and restaurant values
//         form.setValue('branchName', branch.name);
//         if (branch.restaurantId) {
//           form.setValue('restaurantId', branch.restaurantId);
//         }
//       } else {
//         // If branch not found in branches list, still set the values from profile
//         setFilteredBranches([{
//           id: managerBranch.id,
//           name: managerBranch.name,
//           value: managerBranch.name,
//           restaurantId: managerRestaurant?.id || ''
//         }]);
//         form.setValue('branchName', managerBranch.name);
//         if (managerRestaurant?.id) {
//           form.setValue('restaurantId', managerRestaurant.id);
//         }
//       }
//     }
//   }, [form, form.watch('restaurantId'), branches, isAdmin, managerBranch, managerRestaurant]);

// //   // Fetch categories when branch is selected
// //   React.useEffect(() => {
// //     const selectedBranchName = form.watch("branchName");
// //     if (selectedBranchName) {
// //       const fetchCategoriesForBranch = async () => {
// //         try {
// //           if (selectedBranchName === "global") {
// //             // For global selection, load all categories from all branches
// //             const categoriesRes = await categoryApi.getCategories({});
// //             const categoriesData = Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [];
// //             setCategories(categoriesData);

// //             // Only reset category selection when branch changes in create mode, not edit mode
// //             if (!isEditMode) {
// //               form.setValue("categoryId", "");
// //             }
// //           } else {
// //             // Find the branch ID from the selected branch name
// //             const selectedBranch = filteredBranches.find(branch => branch.name === selectedBranchName);
// //             if (selectedBranch) {
// //               const categoriesRes = await categoryApi.getCategories({ branchId: selectedBranch.id });
// //               const categoriesData = Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [];
// //               setCategories(categoriesData);

// //               // Only reset category selection when branch changes in create mode, not edit mode
// //               if (!isEditMode) {
// //                 form.setValue("categoryId", "");
// //               }
// //             } else {
// //               setCategories([]);
// //               if (!isEditMode) {
// //                 form.setValue("categoryId", "");
// //               }
// //             }
// //           }
// //         } catch (error) {
// //           console.error("Error fetching categories for branch:", error);
// //           setCategories([]);
// //           if (!isEditMode) {
// //             form.setValue("categoryId", "");
// //           }
// //         }
// //       };

// //       fetchCategoriesForBranch();
// //     } else {
// //       // No branch selected, clear categories
// //       setCategories([]);
// //       if (!isEditMode) {
// //         form.setValue("categoryId", "");
// //       }
// //     }
// //   }, [form.watch("branchName"), filteredBranches, form, isEditMode]);

// //   // Also load restaurants when editing with initial data
// //   React.useEffect(() => {
// //     if (initialData && isEditMode) {
// //       const restaurantId = initialData.restaurantId || initialData.branch?.restaurantId;

// //       if (restaurantId) {
// //         // Check if the current restaurants array already contains the restaurant we need
// //         const restaurantExists = restaurants.some(r => r.id === restaurantId);

// //         if (!restaurantExists) {
// //           console.log('Restaurant not found in current restaurants array, loading specific restaurant:', restaurantId);

// //           // Load only the specific restaurant for this menu item
// //           restaurantApi.getRestaurantById(restaurantId).then((res) => {
// //             if (res?.data?.data) {
// //               console.log('Loaded specific restaurant for editing:', res.data.data);
// //               setRestaurants([res.data.data]); // Set as array with single restaurant
// //             } else {
// //               console.log('Restaurant not found with ID:', restaurantId);
// //               // Fallback: load all restaurants and filter for the specific one
// //               console.log('Falling back to loading all restaurants');
// //               restaurantApi.getRestaurantsForDropdown().then((fallbackRes) => {
// //                 const allRestaurants = Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [];
// //                 const specificRestaurant = allRestaurants.find(r => r.id === restaurantId);
// //                 if (specificRestaurant) {
// //                   console.log('Found restaurant in fallback:', specificRestaurant);
// //                   setRestaurants([specificRestaurant]);
// //                 } else {
// //                   console.log('Restaurant not found even in fallback, setting empty array');
// //                   setRestaurants([]);
// //                 }
// //               }).catch((fallbackError) => {
// //                 console.error("Error in fallback restaurant loading:", fallbackError);
// //                 setRestaurants([]);
// //               });
// //             }
// //           }).catch((error) => {
// //             console.error("Error loading specific restaurant for editing:", error);
// //             // Fallback: load allrestaurants  and filter for the specific one
// //             console.log('Error loading specific restaurant, falling back to all restaurants');
// //             restaurantApi.getRestaurantsForDropdown().then((fallbackRes) => {
// //               const allRestaurants = Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [];
// //               const specificRestaurant = allRestaurants.find(r => r.id === restaurantId);
// //               if (specificRestaurant) {
// //                 console.log('Found restaurant in fallback after error:', specificRestaurant);
// //                 setRestaurants([specificRestaurant]);
// //               } else {
// //                 console.log('Restaurant not found even in fallback after error, setting empty array');
// //                 setRestaurants([]);
// //               }
// //             }).catch((fallbackError) => {
// //               console.error("Error in fallback restaurant loading:", fallbackError);
// //               setRestaurants([]);
// //             });
// //           });
// //         } else {
// //           console.log('Restaurant already exists in restaurants array, no need to reload');
// //         }
// //       } else {
// //         console.log('No restaurantId found in initialData');
// //       }
// //     }
// //   }, [initialData?.restaurantId, initialData?.branch?.restaurantId, isEditMode]);
// //   // Also load branches when editing with initial data
// //   React.useEffect(() => {
// //     if (initialData && isEditMode) {
// //       const restaurantId = initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id;
// //       console.log('Branch loading check:', {
// //         initialDataRestaurantId: initialData.restaurantId,
// //         branchRestaurantId: initialData.branch?.restaurantId,
// //         restaurantIdFromRelation: initialData.restaurant?.id,
// //         extractedRestaurantId: restaurantId,
// //         isEditMode,
// //         shouldLoad: !!restaurantId
// //       });

// //       if (restaurantId) {
// //         console.log('Loading branches for editing with restaurantId:', restaurantId);
// //         branchApi.getBranchesByRestaurant(restaurantId).then((res) => {
// //           const branchesData = Array.isArray(res?.data?.data) ? res.data.data : [];
// //           console.log('Loaded branches for editing:', branchesData);
// //           setFilteredBranches(branchesData.map(branch => ({
// //             id: branch.id,
// //             name: branch.name
// //           })));
// //         }).catch((error) => {
// //           console.error("Error loading branches for editing:", error);
// //           setFilteredBranches([]);
// //         });
// //       } else {
// //         console.log('No restaurantId found for branch loading');
// //       }
// //     }
// //   }, [initialData?.restaurantId, initialData?.branch?.restaurantId, initialData?.restaurant?.id, isEditMode]);

// //   // Also load categories when editing with initial data
// //   React.useEffect(() => {
// //     if (initialData && initialData.categoryId && isEditMode) {
// //       console.log('Loading categories for editing with categoryId:', initialData.categoryId);

// //       // Get the branch ID from the menu item's branch information
// //       const branchId = initialData.branchId || initialData.branch?.id;

// //       if (branchId) {
// //         // Load categories for the specific branch that the menu item belongs to
// //         console.log('Loading categories for branch ID:', branchId);
// //         categoryApi.getCategories({ branchId: branchId }).then((res) => {
// //           const branchCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
// //           console.log('Loaded categories for menu item branch:', branchCategories);
// //           setCategories(branchCategories);
// //         }).catch((error) => {
// //           console.error("Error loading categories for menu item branch:", error);
// //           setCategories([]);
// //         });
// //       } else if (!isAdmin && user?.branch) {
// //         // For managers without branch info in the menu item, load categories for their branch
// //         const normalizedUserBranch = normalizeBranchName(user.branch);
// //         console.log('Loading categories for manager branch:', normalizedUserBranch);

// //         branchApi.getBranchesByRestaurant(initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id || "").then((branchesRes) => {
// //           const allBranches = Array.isArray(branchesRes?.data?.data) ? branchesRes.data.data : [];
// //           const userBranch = allBranches.find((b: any) => b.name === normalizedUserBranch);

// //           if (userBranch) {
// //             categoryApi.getCategories({ branchId: userBranch.id }).then((res) => {
// //               const branchCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
// //               console.log('Loaded categories for manager branch:', branchCategories);
// //               setCategories(branchCategories);
// //             }).catch((error) => {
// //               console.error("Error loading categories for manager branch:", error);
// //               setCategories([]);
// //             });
// //           } else {
// //             console.log('User branch not found, loading all categories');
// //             categoryApi.getCategories({}).then((res) => {
// //               const allCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
// //               setCategories(allCategories);
// //             }).catch((error) => {
// //               console.error("Error loading all categories:", error);
// //               setCategories([]);
// //             });
// //           }
// //         }).catch((error) => {
// //           console.error("Error loading branches:", error);
// //           setCategories([]);
// //         });
// //       } else {
// //         // For admins, load all categories
// //         console.log('Loading all categories for admin');
// //         categoryApi.getCategories({}).then((res) => {
// //           const allCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
// //           console.log('Loaded all categories for admin:', allCategories);
// //           setCategories(allCategories);
// //         }).catch((error) => {
// //           console.error("Error loading categories for admin:", error);
// //           setCategories([]);
// //         });
// //       }
// //     }
// //   }, [initialData?.categoryId, isEditMode, isAdmin, user?.branch, initialData?.restaurantId, initialData?.branch?.restaurantId, initialData?.restaurant?.id, initialData?.branchId, initialData?.branch?.id]);

// //   // Debug initialData structure
// //   React.useEffect(() => {
// //     if (initialData) {
// //       console.log('MenuItemForm initialData:', {
// //         id: initialData.id,
// //         name: initialData.name,
// //         restaurantId: initialData.restaurantId,
// //         branchId: initialData.branchId,
// //         branchName: initialData.branchName,
// //         branch: initialData.branch,
// //         categoryId: initialData.categoryId
// //       });
// //     }
// //   }, [initialData]);

// //   // Update ingredient names and stock after inventory items are loaded
// //   React.useEffect(() => {
// //     if (!initialData || inventoryItems.length === 0) return;

// //     const updatedIngredients = (initialData.menuItemIngredients || [])
// //       .filter((ing) => ing && ing.inventoryItemId)
// //       .map((ing) => {
// //         const inventory = inventoryItems.find(
// //           (item) => item.id === ing.inventoryItemId
// //         );
// //         return {
// //           inventoryItemId: ing.inventoryItemId,
// //           name: inventory?.name || ing.inventoryItem?.name || "Unknown",
// //           quantity: ing.quantity || 0,
// //           unit: (ing.unit && ing.unit.trim() !== "") ? ing.unit : (inventory?.unit || "pieces"),
// //           currentStock: inventory?.quantity || 0,
// //         };
// //       });

// //     // Reset form with updated ingredient names
// //     form.setValue("ingredients", updatedIngredients);
// //   }, [inventoryItems, initialData, form]);
// //   const selectedModifiers = React.useMemo(() => {
// //     try {
// //       const formModifiers = form.getValues("modifiers");

// //       if (!Array.isArray(formModifiers)) {
// //         return [];
// //       }

// //       return formModifiers
// //         .map(mod => {
// //           if (!mod) return null;
// //           const fullModifier = allModifiers.find(m => m.id === mod.id);
// //           return fullModifier ? {
// //             id: fullModifier.id,
// //             name: fullModifier.name,
// //             price: fullModifier.price,
// //             isActive: fullModifier.isActive !== false
// //           } : null;
// //         })
// //         .filter((m): m is NonNullable<typeof m> => m !== null);
// //     } catch (error) {
// //       console.error('Error getting selected modifiers:', error);
// //       return [];
// //     }
// //   }, [allModifiers, form.watch("modifiers")]);

// //   const selectedIngredients = React.useMemo(() => {
// //     try {
// //       const formIngredients = form.getValues("ingredients");
// //       return Array.isArray(formIngredients) ? formIngredients : [];
// //     } catch (error) {
// //       console.error('Error getting selected ingredients:', error);
// //       return [];
// //     }
// //   }, [form.watch("ingredients")]);

// //   const filteredModifiers = React.useMemo(() => {
// //     return allModifiers.filter(
// //       modifier => 
// //         modifier.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
// //         !selectedModifiers.some(selected => selected.id === modifier.id)
// //     );
// //   }, [allModifiers, searchTerm, selectedModifiers]);

// //   const filteredInventoryItems = React.useMemo(() => {
// //     return inventoryItems.filter(
// //       item => 
// //         item.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase()) &&
// //         !selectedIngredients.some(selected => selected.inventoryItemId === item.id)
// //     );
// //   }, [inventoryItems, ingredientSearchTerm, selectedIngredients]);

// //   const handleAddModifier = (modifier: { id: string; name: string; price: number }) => {
// //     const currentModifiers = form.getValues("modifiers") || [];
// //     form.setValue("modifiers", [
// //       ...currentModifiers,
// //       {
// //         ...modifier,
// //         isActive: true,
// //         options: [],
// //         minSelection: 0,
// //         maxSelection: 0,
// //         type: "SINGLE"
// //       }
// //     ]);
// //     setSearchTerm("");
// //   };

// //   const handleRemoveModifier = (modifierId: string) => {
// //     const currentModifiers = form.getValues("modifiers") || [];
// //     form.setValue(
// //       "modifiers",
// //       currentModifiers.filter(mod => mod.id !== modifierId)
// //     );
// //   };

// //   const handleAddIngredient = (inventoryItem: { id: string; name: string; unit: string }) => {
// //     const currentIngredients = form.getValues("ingredients") || [];
// //     form.setValue("ingredients", [
// //       ...currentIngredients,
// //       {
// //         inventoryItemId: inventoryItem.id,
// //         name: inventoryItem.name,
// //         quantity: 1,
// //         unit: inventoryItem.unit,
// //         currentStock: inventoryItems.find(item => item.id === inventoryItem.id)?.quantity || 0
// //       }
// //     ]);
// //     setIngredientSearchTerm("");
// //     setIsIngredientDropdownOpen(false);
// //   };

// //   const handleRemoveIngredient = (inventoryItemId: string) => {
// //     const currentIngredients = form.getValues("ingredients") || [];
// //     form.setValue(
// //       "ingredients",
// //       currentIngredients.filter(ing => ing.inventoryItemId !== inventoryItemId)
// //     );
// //   };

// //   const handleIngredientQuantityChange = (inventoryItemId: string, quantity: number) => {
// //     const currentIngredients = form.getValues("ingredients") || [];
// //     const updatedIngredients = currentIngredients.map(ing =>
// //       ing.inventoryItemId === inventoryItemId ? { ...ing, quantity } : ing
// //     );
// //     form.setValue("ingredients", updatedIngredients);
// //   };

// //   const handleIngredientUnitChange = (inventoryItemId: string, unit: string) => {
// //     const currentIngredients = form.getValues("ingredients") || [];
// //     const updatedIngredients = currentIngredients.map(ing =>
// //       ing.inventoryItemId === inventoryItemId ? { ...ing, unit } : ing
// //     );
// //     form.setValue("ingredients", updatedIngredients);
// //   };

// //   const onSubmit = async (data: MenuItemFormValues) => {
// //     // Prevent default form submission
// //     event?.preventDefault();

// //     setIsSubmitting(true);
// //     try {
// //       console.log('Form data before processing:', JSON.stringify(data, null, 2));

// //       // Extract and remove branchId if it exists
// //       const { restaurantId, branchName, modifiers, ingredients, branchId, ...dataWithoutExtras } = data;

// //       console.log('Data after destructuring:', {
// //         branchName,
// //         hasBranchId: !!branchId,
// //         dataWithoutExtras: Object.keys(dataWithoutExtras)
// //       });

// //       // Find the selected branch to get its ID
// //       const selectedBranch = filteredBranches.find(branch => branch.name === branchName);

// //       // Create a clean data object with only the fields we want to send
// //       const formattedData: any = {
// //         name: data.name,
// //         description: data.description,
// //         imageUrl: data.imageUrl,
// //         price: Number(data.price) || 0,
// //         cost: Number(data.cost) || 0,
// //         taxRate: Number(data.taxRate) || 0,
// //         taxExempt: data.taxExempt,
// //         isActive: data.isActive,
// //         categoryId: data.categoryId,
// //         tags: data.tags || [],
// // // Only include branchName if not global
// //         ...(branchName !== "global" && selectedBranch?.name && {
// //           branchName: selectedBranch.name
// //         }),
// //         // Handle modifiers properly
// //         ...(modifiers && modifiers.length > 0 && {
// //           modifiers: {
// //             connect: modifiers.map(({ id }) => ({ id }))
// //           }
// //         }),
// //         ingredients: {
// //           create: ingredients.map(ing => ({
// //             inventoryItemId: ing.inventoryItemId,
// //             quantity: ing.quantity,
// //             unit: ing.unit
// //           }))
// //         }
// //       };

// //       console.log('Sending to API:', JSON.stringify(formattedData, null, 2));

// //       if (isEditMode && initialData?.id) {
// //         await menuItemApi.updateItem(initialData.id, formattedData as any);
// //         toast({
// //           title: "Success",
// //           description: "Menu item updated successfully.",
// //         });
// //       } else {
// //         const response = await menuItemApi.createItem(formattedData as any);
// //         toast({
// //           title: "Success",
// //           description: "Menu item created successfully.",
// //         });
// //         // If creating a new item, update the URL to the edit page
// //         if (response?.data?.id) {
// //           window.history.pushState({}, '', `/dashboard/menu/items/edit/${response.data.id}`);
// //         }
// //       }

// //       // Call onSuccess after a short delay to allow the toast to show
// //       setTimeout(() => {
// //         onSuccess?.();
// //       }, 500);
// //     } catch (error) {
// //       console.error("Error saving menu item:", error);
// //       toast({
// //         title: "Error",
// //         description: "Failed to save menu item. Please try again.",
// //         variant: "destructive",
// //       });
// //     } finally {
// //       setIsSubmitting(false);
// //     }
// //   };

// //   if (isLoading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-[400px]">
// //         <Loader2 className="h-8 w-8 animate-spin" />
// //       </div>
// //     );
// //   }

// //   return (
// //     <Form {...form}>
// //       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
// //         <div className="space-y-4">
// //           <FormField
// //             control={form.control}
// //             name="name"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Name</FormLabel>
// //                 <FormControl>
// //                   <Input placeholder="Enter item name" {...field} />
// //                 </FormControl>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           <FormField
// //             control={form.control}
// //             name="description"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Description</FormLabel>
// //                 <FormControl>
// //                   <Textarea
// //                     placeholder="Enter item description"
// //                     className="min-h-[100px]"
// //                     {...field}
// //                   />
// //                 </FormControl>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           <FormField
// //             control={form.control}
// //             name="imageUrl"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Image</FormLabel>
// //                 <FormControl>
// //                   <ImageUpload
// //                     value={field.value ? [field.value] : []}
// //                     disabled={isSubmitting}
// //                     onChange={(url) => field.onChange(url)}
// //                     onRemove={() => field.onChange("")}
// //                   />
// //                 </FormControl>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //             <FormField
// //               control={form.control}
// //               name="price"
// //               render={({ field }) => (
// //                 <FormItem>
// //                   <FormLabel>Price</FormLabel>
// //                   <FormControl>
// //                     <Input
// //                       type="number"
// //                       step="0.01"
// //                       min="0.01"
// //                       placeholder="0.00"
// //                       {...field}
// //                     />
// //                   </FormControl>
// //                   <FormMessage />
// //                 </FormItem>
// //               )}
// //             />

// //             <FormField
// //               control={form.control}
// //               name="cost"
// //               render={({ field }) => (
// //                 <FormItem>
// //                   <FormLabel>Cost</FormLabel>
// //                   <FormControl>
// //                     <Input
// //                       type="number"
// //                       step="0.01"
// //                       min="0"
// //                       placeholder="0.00"
// //                       {...field}
// //                     />
// //                   </FormControl>
// //                   <FormMessage />
// //                 </FormItem>
// //               )}
// //             />
// //           </div>

// //           <FormField
// //             control={form.control}
// //             name="taxRate"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Tax Rate</FormLabel>
// //                 <Select
// //                   onValueChange={(value) => field.onChange(Number(value))}
// //                   value={field.value?.toString()}
// //                   disabled={isSubmitting}
// //                 >
// //                   <FormControl>
// //                     <SelectTrigger>
// //                       <SelectValue placeholder="Select tax rate">
// //                         {field.value === 0 ? "0% (No Tax)" : field.value === 20 ? "20% (VAT)" : "Select tax rate"}
// //                       </SelectValue>
// //                     </SelectTrigger>
// //                   </FormControl>
// //                   <SelectContent>
// //                     <SelectItem value="0">0% (No Tax)</SelectItem>
// //                     <SelectItem value="20">20% (VAT)</SelectItem>
// //                   </SelectContent>
// //                 </Select>
// //                 <FormDescription>
// //                   Select the tax rate for this menu item.
// //                 </FormDescription>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           <FormField
// //             control={form.control}
// //             name="categoryId"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Category</FormLabel>
// //                 <Select
// //                   key={`category-${formInitialized}-${categories.length}`}
// //                   onValueChange={field.onChange}
// //                   value={field.value}
// //                   disabled={isSubmitting}
// //                 >
// //                   <FormControl>
// //                     <SelectTrigger>
// //                       <SelectValue placeholder="Select a category">
// //                         {field.value ? categories.find(c => c.id === field.value)?.name || field.value : "Select a category"}
// //                       </SelectValue>
// //                     </SelectTrigger>
// //                   </FormControl>
// //                   <SelectContent>
// //                     {categories
// //                       .filter((category) => category.id && category.id.trim() !== "")
// //                       .map((category) => (
// //                         <SelectItem key={category.id} value={category.id}>
// //                           {category.name}
// //                         </SelectItem>
// //                       ))}
// //                     {categories.length === 0 && (
// //                       <div className="p-2 text-sm text-muted-foreground">
// //                         {form.watch("branchName")
// //                           ? "No categories found for selected branch. Please create a category first."
// //                           : "Please select a branch first to see available categories."
// //                         }
// //                       </div>
// //                     )}
// //                   </SelectContent>
// //                 </Select>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           <FormField
// //             control={form.control}
// //             name="restaurantId"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Restaurant</FormLabel>
// //                 <Select
// //                   key={`restaurant-${formInitialized}-${restaurants.length}`}
// //                   onValueChange={field.onChange}
// //                   value={field.value}
// //                   disabled={isSubmitting}
// //                 >
// //                   <FormControl>
// //                     <SelectTrigger>
// //                       <SelectValue placeholder="Select a restaurant">
// //                         {field.value ? restaurants.find(r => r.id === field.value)?.name || field.value : "Select a restaurant"}
// //                       </SelectValue>
// //                     </SelectTrigger>
// //                   </FormControl>
// //                   <SelectContent>
// //                     {restaurants
// //                       .filter((restaurant) => restaurant.id && restaurant.id.trim() !== "")
// //                       .map((restaurant) => (
// //                         <SelectItem key={restaurant.id} value={restaurant.id}>
// //                           {restaurant.name}
// //                         </SelectItem>
// //                       ))}
// //                   </SelectContent>
// //                 </Select>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           <FormField
// //             control={form.control}
// //             name="branchName"
// //             render={({ field }) => (
// //               <FormItem>
// //                 <FormLabel>Branch</FormLabel>
// //                 <Select
// //                   key={`branch-${formInitialized}-${filteredBranches.length}`}
// //                   onValueChange={field.onChange}
// //                   value={field.value}
// //                   disabled={isSubmitting || !form.watch("restaurantId")}
// //                 >
// //                   <FormControl>
// //                     <SelectTrigger>
// //                       <SelectValue placeholder="Select a branch">
// //                         {field.value === "global"
// //                           ? "🌐 Global (All Branches)"
// //                           : field.value
// //                             ? filteredBranches.find(b => 
// //                                 b.name?.toLowerCase() === field.value?.toLowerCase() || 
// //                                 b.id === field.value
// //                               )?.name || field.value
// //                             : "Select a branch"
// //                         }
// //                       </SelectValue>
// //                     </SelectTrigger>
// //                   </FormControl>
// //                   <SelectContent>
// //                     {/* Global option for all branches */}
// //                     <SelectItem key="global" value="global">
// //                       🌐 Global (All Branches)
// //                     </SelectItem>
// //                     {filteredBranches.length > 0 ? (
// //                       filteredBranches
// //                         .filter((branch) => branch.id && branch.id.trim() !== "")
// //                         .map((branch) => {
// //                           // Use branch.id as value for more reliable matching
// //                           return (
// //                             <SelectItem key={branch.id} value={branch.id}>
// //                               {branch.name}
// //                             </SelectItem>
// //                           );
// //                         })
// //                     ) : (
// //                       <div className="p-2 text-sm text-muted-foreground">
// //                         {restaurants.length > 0 ? "Select a restaurant first" : "No branches available"}
// //                       </div>
// //                     )}
// //                   </SelectContent>
// //                 </Select>
// //                 <FormMessage />
// //               </FormItem>
// //             )}
// //           />

// //           {/* Ingredients Section */}
// //           <div className="space-y-4">
// //             <FormLabel className="flex items-center gap-2">
// //               <ChefHat className="h-4 w-4" />
// //               Ingredients
// //             </FormLabel>
// //             <div className="space-y-2">
// //               {selectedIngredients.map((ingredient) => (
// //                 <div
// //                   key={ingredient.inventoryItemId}
// //                   className="flex items-center justify-between rounded-md border p-3"
// //                 >
// //                   <div className="flex-1">
// //                     <p className="font-medium">{ingredient.name}</p>
// //                     <div className="flex items-center gap-2 mt-1">
// //                       <Input
// //                         type="number"
// //                         step="0.01"
// //                         min="0.01"
// //                         value={ingredient.quantity}
// //                         onChange={(e) => 
// //                           handleIngredientQuantityChange(
// //                             ingredient.inventoryItemId, 
// //                             parseFloat(e.target.value) || 0
// //                           )
// //                         }
// //                         className="w-20 h-8"
// //                       />
// //                       <Select
// //                         value={ingredient.unit}
// //                         onValueChange={(value) => 
// //                           handleIngredientUnitChange(ingredient.inventoryItemId, value)
// //                         }
// //                       >
// //                         <SelectTrigger className="w-24 h-8">
// //                           <SelectValue />
// //                         </SelectTrigger>
// //                         <SelectContent>
// //                           {units
// //                             .filter((unit) => unit && unit.trim() !== "")
// //                             .map((unit) => (
// //                               <SelectItem key={unit} value={unit}>
// //                                 {unit}
// //                               </SelectItem>
// //                             ))}
// //                         </SelectContent>
// //                       </Select>
// //                       <span className="text-sm text-muted-foreground">
// //                         Stock: {ingredient.currentStock} {ingredient.unit}
// //                       </span>
// //                     </div>
// //                   </div>
// //                   <Button
// //                     type="button"
// //                     variant="ghost"
// //                     size="icon"
// //                     onClick={() => handleRemoveIngredient(ingredient.inventoryItemId)}
// //                   >
// //                     <XIcon className="h-4 w-4" />
// //                   </Button>
// //                 </div>
// //               ))}

// //               <div className="relative">
// //                 <Button
// //                   type="button"
// //                   variant="outline"
// //                   className="w-full justify-between"
// //                   onClick={() => setIsIngredientDropdownOpen(!isIngredientDropdownOpen)}
// //                 >
// //                   Add Ingredient
// //                   <ChevronDown
// //                     className={`ml-2 h-4 w-4 transition-transform ${
// //                       isIngredientDropdownOpen ? "rotate-180" : ""
// //                     }`}
// //                   />
// //                 </Button>

// //                 {isIngredientDropdownOpen && (
// //                   <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
// //                     <div className="p-2 border-b">
// //                       <Input 
// //                         placeholder="Search ingredients..."
// //                         value={ingredientSearchTerm}
// //                         onChange={(e) => setIngredientSearchTerm(e.target.value)}
// //                         className="w-full"
// //                       />
// //                     </div>
// //                     <ScrollArea className="h-[200px]">
// //                       {filteredInventoryItems.length > 0 ? (
// //                         filteredInventoryItems.map((item) => (
// //                           <div
// //                             key={item.id}
// //                             className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
// //                             onClick={() => handleAddIngredient(item)}
// //                           >
// //                             <div>
// //                               <span>{item.name}</span>
// //                               <p className="text-sm text-muted-foreground">
// //                                 Available: {item.quantity} {item.unit}
// //                               </p>
// //                             </div>
// //                           </div>
// //                         ))
// //                       ) : (
// //                         <div className="p-4 text-center text-sm text-muted-foreground">
// //                           {ingredientSearchTerm
// //                             ? "No ingredients found."
// //                             : "No available ingredients."}
// //                         </div>
// //                       )}
// //                     </ScrollArea>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           {/* Modifiers Section */}
// //           <div className="space-y-4">
// //             <div className="flex items-center justify-between">
// //               <FormLabel>Modifiers</FormLabel>
// //               {(form.watch("restaurantId") || form.watch("branchName")) && (
// //                 <div className="text-sm text-muted-foreground">
// //                   {form.watch("branchName")
// //                     ? `Branch: ${form.watch("branchName")}`
// //                     : form.watch("restaurantId")
// //                     ? `Restaurant: ${restaurants.find(r => r.id === form.watch("restaurantId"))?.name || "Selected"}`
// //                     : ""
// //                   }
// //                 </div>
// //               )}
// //             </div>
// //             <div className="space-y-2">
// //               {selectedModifiers.map((modifier) => (
// //                 <div
// //                   key={modifier.id}
// //                   className="flex items-center justify-between rounded-md border p-3"
// //                 >
// //                   <div>
// //                     <p className="font-medium">{modifier.name}</p>
// //                     <p className="text-sm text-muted-foreground">
// //                       ${modifier.price.toFixed(2)}
// //                     </p>
// //                   </div>
// //                   <Button
// //                     type="button"
// //                     variant="ghost"
// //                     size="icon"
// //                     onClick={() => handleRemoveModifier(modifier.id)}
// //                   >
// //                     <XIcon className="h-4 w-4" />
// //                   </Button>
// //                 </div>
// //               ))}

// //               <div className="relative">
// //                 <Button
// //                   type="button"

// //                   variant="outline"
// //                   className="w-full justify-between"
// //                   onClick={() => setIsModifierDropdownOpen(!isModifierDropdownOpen)}
// //                   disabled={!form.watch("branchName")}
// //                 >
// //                   Add Modifier
// //                   <ChevronDown
// //                     className={`ml-2 h-4 w-4 transition-transform ${
// //                       isModifierDropdownOpen ? "rotate-180" : ""
// //                     }`}
// //                   />
// //                 </Button>

// //                 {isModifierDropdownOpen && (
// //                   <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
// //                     <div className="p-2 border-b">
// //                       <Input
// //                         placeholder="Search modifiers..."
// //                         value={searchTerm}
// //                         onChange={(e) => setSearchTerm(e.target.value)}
// //                         className="w-full"
// //                       />
// //                     </div>
// //                     <ScrollArea className="h-[200px]">
// //                       {filteredModifiers.length > 0 ? (
// //                         filteredModifiers.map((modifier) => (
// //                           <div
// //                             key={modifier.id}
// //                             className="flex items-center justify-between p-2 hover:bg-accent cursor-pointer"
// //                             onClick={() => handleAddModifier(modifier)}
// //                           >
// //                             <span>{modifier.name}</span>
// //                             <span>${modifier.price.toFixed(2)}</span>
// //                           </div>
// //                         ))
// //                       ) : (
// //                         <div className="p-4 text-center text-sm text-muted-foreground">
// //                           {searchTerm
// //                             ? "No modifiers found."
// //                             : !form.watch("branchName")
// //                             ? "Please select a branch first to see available modifiers."
// //                             : "No available modifiers."}
// //                         </div>
// //                       )}
// //                     </ScrollArea>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
// //           </div>

// //           <FormField
// //             control={form.control}
// //             name="isActive"
// //             render={({ field }) => (
// //               <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
// //                 <div className="space-y-0.5">
// //                   <FormLabel className="text-base">Active</FormLabel>
// //                   <FormDescription>
// //                     This item will be visible to customers when active.
// //                   </FormDescription>
// //                 </div>
// //                 <FormControl>
// //                   <Switch
// //                     checked={field.value}
// //                     onCheckedChange={field.onChange}
// //                   />
// //                 </FormControl>
// //               </FormItem>
// //             )}
// //           />
// //         </div>

// //         <div className="flex justify-end space-x-2">
// //           <Button
// //             type="button"
// //             variant="outline"
// //             onClick={() => (onCancel ? onCancel() : router.back())}
// //             disabled={isSubmitting}
// //           >
// //             Cancel
// //           </Button>
// //           <Button type="submit" disabled={isSubmitting}>
// //             {isSubmitting ? (
// //               <>
// //                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
// //                 Saving...
// //               </>
// //             ) : (
// //               <>
// //                 <Save className="mr-2 h-4 w-4" />
// //                 {isEditMode ? "Update" : "Create"} Item
// //               </>
// //             )}
// //           </Button>
// //         </div>
// //       </form>
// //     </Form>
// //   );
// // }

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
//   ChefHat,
// } from "lucide-react";
// import menuApi, { MenuItem, categoryApi, modifierApi, menuItemApi } from "@/lib/menu-api";
// import { inventoryItemApi } from "@/lib/inventory-api";
// import { restaurantApi } from "@/lib/restaurant-api";
// import { branchApi } from "@/lib/branch-api";
// import { ImageUpload } from "@/components/ui/image-upload";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Separator } from "@/components/ui/separator";
// import { useBranches } from "@/hooks/use-branches";
// import { useUser } from "@/hooks/use-user";
// const units = ["kg", "g", "lb", "oz", "L", "ml", "pieces", "bunch", "pack", "case"];

// const menuItemFormSchema = z.object({
//   name: z.string().min(2, { message: "Name must be at least 2 characters." }),
//   description: z.string().optional(),
//   imageUrl: z.string().url().optional().or(z.literal("")),
//   price: z.coerce.number().min(0.01, { message: "Price must be greater than 0." }),
//   cost: z.coerce.number().min(0, { message: "Cost cannot be negative." }),
//   categoryId: z.string().optional(),
//   branchName: z.string().min(1, { message: "Branch is required." }),
//   restaurantId: z.string().min(1, { message: "Restaurant is required." }),
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
//   ingredients: z
//     .array(
//       z.object({
//         inventoryItemId: z.string(),
//         name: z.string(),
//         quantity: z.number().min(0.01, { message: "Quantity must be greater than 0" }),
//         unit: z.string(),
//         currentStock: z.number().optional(),
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
//   const [allModifiers, setAllModifiers] = React.useState<{
//     type: string;
//     id: string;
//     name: string;
//     price: number;
//     isActive?: boolean
//   }[]>([]);
//   const [restaurants, setRestaurants] = React.useState<{ id: string; name: string }[]>([]);
//   const [filteredBranches, setFilteredBranches] = React.useState<{ id: string; name: string }[]>([]);
//   const [inventoryItems, setInventoryItems] = React.useState<{
//     id: string;
//     name: string;
//     quantity: number;
//     unit: string;
//     branchName?: string;
//   }[]>([]);
//   const [isModifierDropdownOpen, setIsModifierDropdownOpen] = React.useState(false);
//   const [isIngredientDropdownOpen, setIsIngredientDropdownOpen] = React.useState(false);
//   const [searchTerm, setSearchTerm] = React.useState("");
//   const [ingredientSearchTerm, setIngredientSearchTerm] = React.useState("");
//   const [showCategoryHelp, setShowCategoryHelp] = React.useState(false);
//   const [formInitialized, setFormInitialized] = React.useState(false);
//   const router = useRouter();
//   const { user, isAdmin } = useUser();

//   // Get manager's branch and restaurant from user profile
//   const managerBranch = React.useMemo(() => {
//     if (user?.branch) {
//       // If branch is a string, return it as name
//       if (typeof user.branch === 'string') {
//         return {
//           id: '', // We'll get this from branches list
//           name: user.branch,
//           restaurantId: user.restaurant?.id || ''
//         };
//       }
//       // If branch is an object, extract the data
//       return {
//         id: user.branch.id || '',
//         name: user.branch.name || user.branch || '',
//         restaurantId: user.restaurant?.id || ''
//       };
//     }
//     return null;
//   }, [user?.branch, user?.restaurant]);

//   const managerRestaurant = React.useMemo(() => {
//     return user?.restaurant;
//   }, [user?.restaurant]);

//   // Load branches, filtered by manager's branch if not admin
//   const { branches = [], loading: branchesLoading, error: branchesError } = useBranches({
//     filterByBranchName: isAdmin ? undefined : (managerBranch?.name || '')
//   });

//   const isEditMode = !!initialData;

//   // Set default values based on manager's branch and restaurant
//   const defaultValues = React.useMemo(() => {
//     // For manager, always use their assigned restaurant/branch
//     const managerRestaurantId = managerRestaurant?.id;
//     const managerBranchName = managerBranch?.name;

//     console.log('Manager data for default values:', {
//       managerRestaurantId,
//       managerBranchName,
//       userRole: user?.role,
//       isAdmin
//     });

//     // Use initialData values if in edit mode, otherwise use manager's branch/restaurant
//     const baseValues = {
//       name: initialData?.name || "",
//       description: initialData?.description || "",
//       imageUrl: initialData?.imageUrl || "",
//       price: initialData?.price || 0,
//       cost: initialData?.cost || 0,
//       categoryId: initialData?.categoryId || "",
//       branchName: initialData?.branchName || (user?.role === 'MANAGER' ? managerBranchName : "") || "",
//       restaurantId: initialData?.restaurantId || (user?.role === 'MANAGER' ? managerRestaurantId : "") || "",
//       isActive: initialData?.isActive ?? true,
//       taxRate: initialData?.taxRate || 0,
//       taxExempt: initialData?.taxExempt || false,
//       tags: initialData?.tags || [],
//       modifiers: initialData?.modifiers || [],
//       ingredients: initialData?.ingredients || [],
//       createdAt: initialData?.createdAt || new Date().toISOString(),
//       updatedAt: initialData?.updatedAt || new Date().toISOString(),
//     };

//     console.log('Form default values:', baseValues);
//     return baseValues;
//   }, [initialData, managerBranch, managerRestaurant, user?.role, isAdmin]);

//   const form = useForm<MenuItemFormValues>({
//     resolver: zodResolver(menuItemFormSchema),
//     defaultValues,
//   });

//   // Initialize form with manager's data
//   React.useEffect(() => {
//     if (!formInitialized && user && !isEditMode) {
//       console.log('Initializing form with manager data:', {
//         role: user.role,
//         restaurant: managerRestaurant,
//         branch: managerBranch
//       });

//       if (user.role === 'MANAGER') {
//         // For managers, set the restaurant and branch values
//         if (managerRestaurant?.id) {
//           form.setValue('restaurantId', managerRestaurant.id);
//           // Add the manager's restaurant to restaurants list if not already there
//           setRestaurants(prev => {
//             const exists = prev.some(r => r.id === managerRestaurant.id);
//             if (!exists && managerRestaurant.id && managerRestaurant.name) {
//               return [...prev, { id: managerRestaurant.id, name: managerRestaurant.name }];
//             }
//             return prev;
//           });
//         }

//         if (managerBranch?.name) {
//           form.setValue('branchName', managerBranch.name);
//           // Add the manager's branch to filtered branches if not already there
//           setFilteredBranches(prev => {
//             const exists = prev.some(b => b.name === managerBranch.name);
//             if (!exists && managerBranch.name) {
//               return [...prev, { id: managerBranch.id || managerBranch.name, name: managerBranch.name }];
//             }
//             return prev;
//           });
//         }
//       }

//       setFormInitialized(true);
//     }
//   }, [form, user, managerRestaurant, managerBranch, isEditMode, formInitialized]);

//   // Filter branches based on selected restaurant and manager's access
//   React.useEffect(() => {
//     if (!form || !user) return;

//     console.log('Filtering branches:', {
//       isAdmin,
//       managerBranch,
//       branchesCount: branches.length,
//       restaurantId: form.watch('restaurantId')
//     });

//     if (isAdmin) {
//       // For admin, show branches filtered by selected restaurant
//       const restaurantId = form.watch('restaurantId');
//       if (restaurantId) {
//         const filtered = branches.filter(
//           (branch) => branch.restaurantId === restaurantId
//         );
//         setFilteredBranches(filtered);

//         // If there's only one branch, select it
//         if (filtered.length === 1 && !form.getValues('branchName')) {
//           form.setValue('branchName', filtered[0].name);
//         }
//       } else {
//         setFilteredBranches(branches);
//       }
//     } else {
//       // For non-admin (MANAGER), only show their assigned branch
//       if (managerBranch) {
//         const branch = branches.find(b =>
//           b.id === managerBranch.id ||
//           b.name === managerBranch.name ||
//           (typeof managerBranch === 'string' && b.name === managerBranch)
//         );

//         if (branch) {
//           setFilteredBranches([branch]);
//           // Ensure the branch value is set
//           if (form.getValues('branchName') !== branch.name) {
//             form.setValue('branchName', branch.name);
//           }
//           // Also set the restaurant if not already set
//           if (branch.restaurantId && !form.getValues('restaurantId')) {
//             form.setValue('restaurantId', branch.restaurantId);
//           }
//         } else {
//           // If branch not found in branches list, create a placeholder
//           const placeholderBranch = {
//             id: managerBranch.id || managerBranch.name,
//             name: managerBranch.name,
//             restaurantId: managerRestaurant?.id
//           };
//           setFilteredBranches([placeholderBranch]);
//           form.setValue('branchName', managerBranch.name);
//           if (managerRestaurant?.id) {
//             form.setValue('restaurantId', managerRestaurant.id);
//           }
//         }
//       }
//     }
//   }, [form, form.watch('restaurantId'), branches, isAdmin, managerBranch, managerRestaurant, user]);
//   const onSubmit = async (data: MenuItemFormValues) => {
//     event?.preventDefault();
//     setIsSubmitting(true);

//     try {
//       console.log('Form submission data:', data);

//       // For managers, ensure the restaurant and branch are set
//       if (user?.role === 'MANAGER') {
//         if (managerRestaurant?.id) {
//           data.restaurantId = managerRestaurant.id;
//         }
//         if (managerBranch?.name) {
//           data.branchName = managerBranch.name;
//         }
//       }

//       // Find the selected branch
//       const selectedBranch = filteredBranches.find(b => b.name === data.branchName);
      
//       // Prepare the data for API submission with direct IDs
//       const { category, branch, restaurant, ...restData } = data;
//       const submissionData: any = {
//         ...restData,
//         // Ensure we have the correct branch ID
//         branchId: selectedBranch?.id,
//         // Handle modifiers if any
//         modifiers: selectedModifiers.length > 0 ? {
//           connect: selectedModifiers.map(mod => ({ id: mod.id }))
//         } : undefined,
//         // Handle ingredients if any
//         ingredients: selectedIngredients.length > 0 ? {
//           create: selectedIngredients.map(ing => ({
//             inventoryItem: { connect: { id: ing.inventoryItemId } },
//             quantity: ing.quantity,
//             unit: ing.unit
//           }))
//         } : undefined
//       };

//       if (isEditMode && initialData?.id) {
//         // Update existing menu item
//         await menuItemApi.updateItem(initialData.id, submissionData);
//         toast({
//           title: "Success",
//           description: "Menu item updated successfully",
//         });
//       } else {
//         // Create new menu item
//         await menuItemApi.createItem(submissionData);
//         toast({
//           title: "Success",
//           description: "Menu item created successfully",
//         });
//       }

//       if (onSuccess) {
//         onSuccess();
//       }
//     } catch (error) {
//       console.error('Error submitting form:', error);
//       toast({
//         title: "Error",
//         description: error.response?.data?.message || "An error occurred while saving the menu item",
//         variant: "destructive",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };
//   // Fetch categories, modifiers, and inventory items
//   React.useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         // Get current branch selection for modifier filtering
//         const selectedBranchName = form.getValues("branchName");
//         const selectedRestaurantId = form.getValues("restaurantId");

//         console.log('Fetching data with:', { selectedBranchName, selectedRestaurantId });

//         // Prepare modifier API parameters
//         const modifierParams: any = {};
//         if (selectedBranchName && selectedBranchName !== "" && selectedBranchName !== "global") {
//           // Find the branch ID from the selected branch name
//           const selectedBranch = filteredBranches.find(branch => branch.name === selectedBranchName);
//           if (selectedBranch) {
//             modifierParams.branchId = selectedBranch.id;
//           }
//         } else if (selectedBranchName === "global") {
//           // For global selection, don't filter by branch - load all modifiers
//         }

//         const [modifiersRes, inventoryRes] = await Promise.all([
//           modifierApi.getModifiers(modifierParams),
//           inventoryItemApi.getItems(),
//         ]);

//         const allModifiersData = Array.isArray(modifiersRes?.data?.data)
//           ? modifiersRes.data.data.map((m: any) => ({
//             type: m.type || "SINGLE",
//             id: m.id,
//             name: m.name,
//             price: m.price || 0,
//             isActive: m.isActive ?? true,
//           }))
//           : [];

//         setAllModifiers(allModifiersData);

//         // Filter inventory items by branch for managers
//         let inventoryData: any[] = [];
//         if (inventoryRes?.data?.data && Array.isArray(inventoryRes.data.data)) {
//           inventoryData = inventoryRes.data.data;
//         } else if (Array.isArray(inventoryRes?.data)) {
//           inventoryData = inventoryRes.data;
//         } else {
//           inventoryData = [];
//         }

//         if (!isAdmin && managerBranch?.name) {
//           inventoryData = inventoryData.filter((item: any) =>
//             item.branch === managerBranch.name || item.branchName === managerBranch.name
//           );
//         }

//         setInventoryItems(inventoryData.map((item: any) => ({
//           id: item.id,
//           name: item.name,
//           quantity: item.quantity || 0,
//           unit: item.unit || "pieces",
//           branchName: item.branch || item.branchName
//         })));

//         // Only load all restaurants if admin and not in edit mode
//         if (isAdmin && !isEditMode) {
//           const restaurantsRes = await restaurantApi.getRestaurantsForDropdown();
//           setRestaurants(Array.isArray(restaurantsRes?.data?.data) ? restaurantsRes.data.data : []);
//         }

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
//   }, [user, isAdmin, isEditMode, form, filteredBranches, managerBranch]);

//   // Rest of your component remains the same...
//   // [Keep all the existing functions like handleAddModifier, handleRemoveModifier, etc.]

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//         <div className="space-y-4">
//           {/* Name, Description, Image fields remain the same */}

//           {/* Restaurant Field - Hidden for managers, visible for admins */}
//           {isAdmin ? (
//             <FormField
//               control={form.control}
//               name="restaurantId"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Restaurant</FormLabel>
//                   <Select
//                     onValueChange={field.onChange}
//                     value={field.value}
//                     disabled={isSubmitting}
//                   >
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a restaurant">
//                           {field.value ? restaurants.find(r => r.id === field.value)?.name || field.value : "Select a restaurant"}
//                         </SelectValue>
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       {restaurants
//                         .filter((restaurant) => restaurant.id && restaurant.id.trim() !== "")
//                         .map((restaurant) => (
//                           <SelectItem key={restaurant.id} value={restaurant.id}>
//                             {restaurant.name}
//                           </SelectItem>
//                         ))}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           ) : (
//             // For managers, show the restaurant as read-only
//             <FormItem>
//               <FormLabel>Restaurant</FormLabel>
//               <FormControl>
//                 <Input
//                   value={managerRestaurant?.name || "Not assigned"}
//                   disabled
//                   className="bg-muted"
//                 />
//               </FormControl>
//               <FormDescription>
//                 Your assigned restaurant
//               </FormDescription>
//             </FormItem>
//           )}

//           {/* Branch Field - Hidden for managers, visible for admins */}
//           {isAdmin ? (
//             <FormField
//               control={form.control}
//               name="branchName"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Branch</FormLabel>
//                   <Select
//                     onValueChange={field.onChange}
//                     value={field.value}
//                     disabled={isSubmitting || !form.watch("restaurantId")}
//                   >
//                     <FormControl>
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select a branch">
//                           {field.value === "global"
//                             ? "🌐 Global (All Branches)"
//                             : field.value
//                               ? filteredBranches.find(b =>
//                                 b.name?.toLowerCase() === field.value?.toLowerCase() ||
//                                 b.id === field.value
//                               )?.name || field.value
//                               : "Select a branch"
//                           }
//                         </SelectValue>
//                       </SelectTrigger>
//                     </FormControl>
//                     <SelectContent>
//                       <SelectItem key="global" value="global">
//                         🌐 Global (All Branches)
//                       </SelectItem>
//                       {filteredBranches.length > 0 ? (
//                         filteredBranches
//                           .filter((branch) => branch.id && branch.id.trim() !== "")
//                           .map((branch) => (
//                             <SelectItem key={branch.id} value={branch.id}>
//                               {branch.name}
//                             </SelectItem>
//                           ))
//                       ) : (
//                         <div className="p-2 text-sm text-muted-foreground">
//                           {restaurants.length > 0 ? "Select a restaurant first" : "No branches available"}
//                         </div>
//                       )}
//                     </SelectContent>
//                   </Select>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />
//           ) : (
//             // For managers, show the branch as read-only
//             <FormItem>
//               <FormLabel>Branch</FormLabel>
//               <FormControl>
//                 <Input
//                   value={managerBranch?.name || "Not assigned"}
//                   disabled
//                   className="bg-muted"
//                 />
//               </FormControl>
//               <FormDescription>
//                 Your assigned branch
//               </FormDescription>
//             </FormItem>
//           )}

//           {/* Rest of your form fields remain the same */}
//           {/* Category, Ingredients, Modifiers, etc. */}
//         </div>

//         <div className="flex justify-end space-x-2">
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => (onCancel ? onCancel() : router.back())}
//             disabled={isSubmitting}
//           >
//             Cancel
//           </Button>
//           <Button type="submit" disabled={isSubmitting}>
//             {isSubmitting ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Saving...
//               </>
//             ) : (
//               <>
//                 <Save className="mr-2 h-4 w-4" />
//                 {isEditMode ? "Update" : "Create"} Item
//               </>
//             )}
//           </Button>
//         </div>
//       </form>
//     </Form>
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
  ChefHat,
  Tag,
} from "lucide-react";
import { MenuItem, categoryApi, modifierApi, menuItemApi } from "@/lib/menu-api";
import { inventoryItemApi } from "@/lib/inventory-api";
import { restaurantApi } from "@/lib/restaurant-api";
import { branchApi } from "@/lib/branch-api";
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
  categoryId: z.string().min(1, { message: "Category is required." }),
  branchName: z.string().min(1, { message: "Branch is required." }),
  restaurantId: z.string().min(1, { message: "Restaurant is required." }),
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
  const [restaurants, setRestaurants] = React.useState<{ id: string; name: string }[]>([]);
  const [filteredBranches, setFilteredBranches] = React.useState<{ id: string; name: string }[]>([]);
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
  const [tagInput, setTagInput] = React.useState("");
  const [showCategoryHelp, setShowCategoryHelp] = React.useState(false);
  const [formInitialized, setFormInitialized] = React.useState(false);
  const router = useRouter();
  const { user, isAdmin } = useUser();

  // Get manager's branch and restaurant from user profile
  const managerBranch = React.useMemo(() => {
    if (!user?.branch) return null;
    
    // If branch is a string, return it as name
    if (typeof user.branch === 'string') {
      return {
        id: '', // We'll get this from branches list
        name: user.branch,
        restaurantId: user.restaurant?.id || ''
      };
    }
    
    // If branch is an object, extract the data safely
    const branchData = user.branch.branch || user.branch;
    return {
      id: branchData?.id || '',
      name: branchData?.name || user.branch.name || '',
      restaurantId: user.restaurant?.id || ''
    };
  }, [user?.branch, user?.restaurant]);

  const managerRestaurant = React.useMemo(() => {
    return user?.restaurant;
  }, [user?.restaurant]);

  const isEditMode = !!initialData;

  // Set default values based on manager's branch and restaurant
  const defaultValues = React.useMemo(() => {
    // For manager, always use their assigned restaurant/branch
    const managerRestaurantId = managerRestaurant?.id;
    const managerBranchName = managerBranch?.name;

    console.log('Manager data for default values:', {
      managerRestaurantId,
      managerBranchName,
      userRole: user?.role,
      isAdmin
    });

    // Use initialData values if in edit mode, otherwise use manager's branch/restaurant
    const baseValues = {
      name: initialData?.name || "",
      description: initialData?.description || "",
      imageUrl: initialData?.imageUrl || "",
      price: initialData?.price || 0,
      cost: initialData?.cost || 0,
      categoryId: initialData?.categoryId || "",
      branchName: initialData?.branchName || (user?.role === 'MANAGER' ? managerBranchName : "") || "",
      restaurantId: initialData?.restaurantId || (user?.role === 'MANAGER' ? managerRestaurantId : "") || "",
      isActive: initialData?.isActive ?? true,
      taxRate: initialData?.taxRate || 0,
      taxExempt: initialData?.taxExempt || false,
      tags: initialData?.tags || [],
      modifiers: initialData?.modifiers || [],
      ingredients: initialData?.ingredients || [],
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: initialData?.updatedAt || new Date().toISOString(),
    };

    console.log('Form default values:', baseValues);
    return baseValues;
  }, [initialData, managerBranch, managerRestaurant, user?.role, isAdmin]);

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues,
  });

  // Get the selected restaurant ID from the form
  const selectedRestaurantId = form.watch('restaurantId');

  // Load all branches - we'll filter them client-side based on the selected restaurant
  const { branches = [], loading: branchesLoading, error: branchesError } = useBranches({
    filterByBranchName: isAdmin ? undefined : (managerBranch?.name || '')
  });

  // Initialize form with manager's data
  React.useEffect(() => {
    if (!formInitialized && user && !isEditMode) {
      console.log('Initializing form with manager data:', {
        role: user.role,
        restaurant: managerRestaurant,
        branch: managerBranch
      });

      if (user.role === 'MANAGER') {
        // For managers, set the restaurant and branch values
        if (managerRestaurant?.id) {
          form.setValue('restaurantId', managerRestaurant.id);
          // Add the manager's restaurant to restaurants list if not already there
          setRestaurants(prev => {
            const exists = prev.some(r => r.id === managerRestaurant.id);
            if (!exists && managerRestaurant.id && managerRestaurant.name) {
              return [...prev, { id: managerRestaurant.id, name: managerRestaurant.name }];
            }
            return prev;
          });
        }

        if (managerBranch?.name) {
          form.setValue('branchName', managerBranch.name);
          // Add the manager's branch to filtered branches if not already there
          setFilteredBranches(prev => {
            const exists = prev.some(b => b.name === managerBranch.name);
            if (!exists && managerBranch.name) {
              return [...prev, { id: managerBranch.id || managerBranch.name, name: managerBranch.name }];
            }
            return prev;
          });
        }
      }

      setFormInitialized(true);
    }
  }, [form, user, managerRestaurant, managerBranch, isEditMode, formInitialized]);
React.useEffect(() => {
  console.log('Branch filtering debug:', {
    selectedRestaurantId: form.watch('restaurantId'),
    allBranches: branches,
    filteredBranches: filteredBranches,
    restaurants: restaurants
  });
}, [form.watch('restaurantId'), branches, filteredBranches, restaurants]);
  // Filter branches based on selected restaurant and manager's access
 React.useEffect(() => {
  if (!form || !user) return;

  const restaurantId = form.watch('restaurantId');
  console.log('Filtering branches with:', {
    restaurantId,
    branchesCount: branches.length,
    isAdmin,
    managerBranch: managerBranch?.name
  });

  if (isAdmin) {
    // For admin, show branches filtered by selected restaurant
    if (restaurantId) {
      const filtered = branches.filter(
        (branch) => branch.restaurantId === restaurantId
      );
      console.log('Filtered branches for restaurant:', filtered);
      setFilteredBranches(filtered);
      
      // Clear branch selection if the current branch is not in the filtered list
      const currentBranch = form.getValues('branchName');
      if (currentBranch && !filtered.some(b => b.name === currentBranch)) {
        form.setValue('branchName', '');
      }
      
      // If there's only one branch, select it automatically
      if (filtered.length === 1 && !currentBranch) {
        form.setValue('branchName', filtered[0].name);
      }
    } else {
      // If no restaurant is selected, clear branches
      setFilteredBranches([]);
      form.setValue('branchName', '');
    }
  } else {
    // For non-admin (MANAGER), only show their assigned branch
    if (managerBranch) {
      const branch = branches.find(b => 
        b.id === managerBranch.id || 
        b.name === managerBranch.name
      );
      
      if (branch) {
        setFilteredBranches([branch]);
        // Ensure the branch value is set
        if (form.getValues('branchName') !== branch.name) {
          form.setValue('branchName', branch.name);
        }
        // Also set the restaurant if not already set
        if (branch.restaurantId && !form.getValues('restaurantId')) {
          form.setValue('restaurantId', branch.restaurantId);
        }
      } else {
        // If branch not found in branches list, create a placeholder
        console.log('Manager branch not found in branches list, creating placeholder');
        const placeholderBranch = {
          id: managerBranch.id || managerBranch.name,
          name: managerBranch.name,
          restaurantId: managerRestaurant?.id
        };
        setFilteredBranches([placeholderBranch]);
        form.setValue('branchName', managerBranch.name);
        if (managerRestaurant?.id) {
          form.setValue('restaurantId', managerRestaurant.id);
        }
      }
    }
  }
}, [form, form.watch('restaurantId'), branches, isAdmin, managerBranch, managerRestaurant, user]);

  // Fetch categories, modifiers, and inventory items
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get current branch selection for modifier filtering
        const selectedBranchName = form.getValues("branchName");
        const selectedRestaurantId = form.getValues("restaurantId");

        console.log('Fetching data with:', { selectedBranchName, selectedRestaurantId });

        // Prepare modifier API parameters
        const modifierParams: any = {};
        
        if (!isAdmin && (managerBranch || managerRestaurant)) {
          // For managers, we need to find their branch and restaurant to get the IDs
          const branchName = managerBranch ? (typeof managerBranch === 'string' ? managerBranch : managerBranch.name || '') : '';
          const branchId = managerBranch?.id || '';
          const restaurantId = managerRestaurant?.id || '';
          
          // Always include the restaurant ID if available
          if (restaurantId) {
            modifierParams.restaurantId = restaurantId;
          }
          
          // For managers, we want to include:
          // 1. Modifiers specific to their branch
          // 2. Global modifiers for their restaurant
          // 3. Truly global modifiers (no branch or restaurant)
          if (branchId) {
            // If we have a branch ID, use that
            modifierParams.branchId = branchId;
          } else if (branchName) {
            // Otherwise use the branch name
            modifierParams.branchName = branchName;
          }
          
          console.log('Loading modifiers for manager:', { 
            branchId: modifierParams.branchId, 
            branchName: modifierParams.branchName,
            restaurantId: modifierParams.restaurantId 
          });
          
          // Add a flag to indicate this is a manager request
          modifierParams.isManagerRequest = true;
        } else if (selectedBranchName && selectedBranchName !== "" && selectedBranchName !== "global") {
          // For admins, filter by selected branch
          const selectedBranch = filteredBranches.find(branch => branch.name === selectedBranchName);
          if (selectedBranch) {
            modifierParams.branchId = selectedBranch.id;
            if (selectedBranch.restaurantId) {
              modifierParams.restaurantId = selectedBranch.restaurantId;
            }
          }
        } else if (selectedBranchName === "global") {
          // For global selection, don't filter by branch or restaurant - load all global modifiers
          console.log('Loading global modifiers (no branch/restaurant filter)');
        }

        const [modifiersRes, inventoryRes] = await Promise.all([
          modifierApi.getModifiers(modifierParams),
          inventoryItemApi.getItems(),
        ]);

        console.log('Modifiers API response:', modifiersRes);
        
        // Handle both direct array response and data.data structure
        let modifiersData = [];
        if (Array.isArray(modifiersRes?.data)) {
          modifiersData = modifiersRes.data;
        } else if (Array.isArray(modifiersRes?.data?.data)) {
          modifiersData = modifiersRes.data.data;
        }

        const allModifiersData = modifiersData.map((m: any) => ({
          type: m.type || "SINGLE",
          id: m.id,
          name: m.name,
          price: m.price || 0,
          isActive: m.isActive ?? true,
        }));

        console.log('Processed modifiers:', allModifiersData);
        setAllModifiers(allModifiersData);

        // Filter inventory items by branch for managers
        let inventoryData: any[] = [];
        if (inventoryRes?.data?.data && Array.isArray(inventoryRes.data.data)) {
          inventoryData = inventoryRes.data.data;
        } else if (Array.isArray(inventoryRes?.data)) {
          inventoryData = inventoryRes.data;
        } else {
          inventoryData = [];
        }

        if (!isAdmin && managerBranch?.name) {
          inventoryData = inventoryData.filter((item: any) =>
            item.branch === managerBranch.name || item.branchName === managerBranch.name
          );
        }

        setInventoryItems(inventoryData.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || "pieces",
          branchName: item.branch || item.branchName
        })));

        // Only load all restaurants if admin and not in edit mode
        if (isAdmin && !isEditMode) {
          const restaurantsRes = await restaurantApi.getRestaurantsForDropdown();
          setRestaurants(Array.isArray(restaurantsRes?.data?.data) ? restaurantsRes.data.data : []);
        }

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
  }, [user, isAdmin, isEditMode, form, filteredBranches, managerBranch]);

  // Fetch categories when branch is selected
  React.useEffect(() => {
    const selectedBranchName = form.watch("branchName");
    if (selectedBranchName) {
      const fetchCategoriesForBranch = async () => {
        try {
          if (selectedBranchName === "global") {
            // For global selection, load all categories from all branches
            const categoriesRes = await categoryApi.getCategories({});
            const categoriesData = Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [];
            setCategories(categoriesData);

            // Only reset category selection when branch changes in create mode, not edit mode
            if (!isEditMode) {
              form.setValue("categoryId", "");
            }
          } else {
            // Find the branch ID from the selected branch name
            const selectedBranch = filteredBranches.find(branch => branch.name === selectedBranchName);
            if (selectedBranch) {
              const categoriesRes = await categoryApi.getCategories({ branchId: selectedBranch.id });
              const categoriesData = Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [];
              setCategories(categoriesData);

              // Only reset category selection when branch changes in create mode, not edit mode
              if (!isEditMode) {
                form.setValue("categoryId", "");
              }
            } else {
              setCategories([]);
              if (!isEditMode) {
                form.setValue("categoryId", "");
              }
            }
          }
        } catch (error) {
          console.error("Error fetching categories for branch:", error);
          setCategories([]);
          if (!isEditMode) {
            form.setValue("categoryId", "");
          }
        }
      };

      fetchCategoriesForBranch();
    } else {
      // No branch selected, clear categories
      setCategories([]);
      if (!isEditMode) {
        form.setValue("categoryId", "");
      }
    }
  }, [form.watch("branchName"), filteredBranches, form, isEditMode]);
// Add this useEffect to manually fetch branches when restaurant changes
React.useEffect(() => {
  const fetchBranchesForRestaurant = async () => {
    const restaurantId = form.watch('restaurantId');
    if (restaurantId && isAdmin) {
      try {
        console.log('Fetching branches for restaurant:', restaurantId);
        const response = await branchApi.getBranchesByRestaurant(restaurantId);
        const branchesData = Array.isArray(response?.data?.data) ? response.data.data : [];
        console.log('Fetched branches:', branchesData);
        
        setFilteredBranches(branchesData.map(branch => ({
          id: branch.id,
          name: branch.name,
          restaurantId: branch.restaurantId
        })));
      } catch (error) {
        console.error('Error fetching branches for restaurant:', error);
        setFilteredBranches([]);
      }
    }
  };

  fetchBranchesForRestaurant();
}, [form.watch('restaurantId'), isAdmin]);
  // Also load restaurants when editing with initial data
  React.useEffect(() => {
    if (initialData && isEditMode) {
      const restaurantId = initialData.restaurantId || initialData.branch?.restaurantId;

      if (restaurantId) {
        // Check if the current restaurants array already contains the restaurant we need
        const restaurantExists = restaurants.some(r => r.id === restaurantId);

        if (!restaurantExists) {
          console.log('Restaurant not found in current restaurants array, loading specific restaurant:', restaurantId);

          // Load only the specific restaurant for this menu item
          restaurantApi.getRestaurantById(restaurantId).then((res) => {
            if (res?.data?.data) {
              console.log('Loaded specific restaurant for editing:', res.data.data);
              setRestaurants([res.data.data]); // Set as array with single restaurant
            } else {
              console.log('Restaurant not found with ID:', restaurantId);
              // Fallback: load all restaurants and filter for the specific one
              console.log('Falling back to loading all restaurants');
              restaurantApi.getRestaurantsForDropdown().then((fallbackRes) => {
                const allRestaurants = Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [];
                const specificRestaurant = allRestaurants.find(r => r.id === restaurantId);
                if (specificRestaurant) {
                  console.log('Found restaurant in fallback:', specificRestaurant);
                  setRestaurants([specificRestaurant]);
                } else {
                  console.log('Restaurant not found even in fallback, setting empty array');
                  setRestaurants([]);
                }
              }).catch((fallbackError) => {
                console.error("Error in fallback restaurant loading:", fallbackError);
                setRestaurants([]);
              });
            }
          }).catch((error) => {
            console.error("Error loading specific restaurant for editing:", error);
            // Fallback: load all restaurants and filter for the specific one
            console.log('Error loading specific restaurant, falling back to all restaurants');
            restaurantApi.getRestaurantsForDropdown().then((fallbackRes) => {
              const allRestaurants = Array.isArray(fallbackRes?.data?.data) ? fallbackRes.data.data : [];
              const specificRestaurant = allRestaurants.find(r => r.id === restaurantId);
              if (specificRestaurant) {
                console.log('Found restaurant in fallback after error:', specificRestaurant);
                setRestaurants([specificRestaurant]);
              } else {
                console.log('Restaurant not found even in fallback after error, setting empty array');
                setRestaurants([]);
              }
            }).catch((fallbackError) => {
              console.error("Error in fallback restaurant loading:", fallbackError);
              setRestaurants([]);
            });
          });
        } else {
          console.log('Restaurant already exists in restaurants array, no need to reload');
        }
      } else {
        console.log('No restaurantId found in initialData');
      }
    }
  }, [initialData?.restaurantId, initialData?.branch?.restaurantId, isEditMode]);

  // Also load branches when editing with initial data
  React.useEffect(() => {
    if (initialData && isEditMode) {
      const restaurantId = initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id;
      console.log('Branch loading check:', {
        initialDataRestaurantId: initialData.restaurantId,
        branchRestaurantId: initialData.branch?.restaurantId,
        restaurantIdFromRelation: initialData.restaurant?.id,
        extractedRestaurantId: restaurantId,
        isEditMode,
        shouldLoad: !!restaurantId
      });

      if (restaurantId) {
        console.log('Loading branches for editing with restaurantId:', restaurantId);
        branchApi.getBranchesByRestaurant(restaurantId).then((res) => {
          const branchesData = Array.isArray(res?.data?.data) ? res.data.data : [];
          console.log('Loaded branches for editing:', branchesData);
          setFilteredBranches(branchesData.map(branch => ({
            id: branch.id,
            name: branch.name
          })));
        }).catch((error) => {
          console.error("Error loading branches for editing:", error);
          setFilteredBranches([]);
        });
      } else {
        console.log('No restaurantId found for branch loading');
      }
    }
  }, [initialData?.restaurantId, initialData?.branch?.restaurantId, initialData?.restaurant?.id, isEditMode]);

  // Also load categories when editing with initial data
  React.useEffect(() => {
    if (initialData && initialData.categoryId && isEditMode) {
      console.log('Loading categories for editing with categoryId:', initialData.categoryId);

      // Get the branch ID from the menu item's branch information
      const branchId = initialData.branchId || initialData.branch?.id;

      if (branchId) {
        // Load categories for the specific branch that the menu item belongs to
        console.log('Loading categories for branch ID:', branchId);
        categoryApi.getCategories({ branchId: branchId }).then((res) => {
          const branchCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
          console.log('Loaded categories for menu item branch:', branchCategories);
          setCategories(branchCategories);
        }).catch((error) => {
          console.error("Error loading categories for menu item branch:", error);
          setCategories([]);
        });
      } else if (!isAdmin && user?.branch) {
        // For managers without branch info in the menu item, load categories for their branch
        const normalizedUserBranch = typeof user.branch === 'string' ? user.branch : user.branch?.name;
        console.log('Loading categories for manager branch:', normalizedUserBranch);

        branchApi.getBranchesByRestaurant(initialData.restaurantId || initialData.branch?.restaurantId || initialData.restaurant?.id || "").then((branchesRes) => {
          const allBranches = Array.isArray(branchesRes?.data?.data) ? branchesRes.data.data : [];
          const userBranch = allBranches.find((b: any) => b.name === normalizedUserBranch);

          if (userBranch) {
            categoryApi.getCategories({ branchId: userBranch.id }).then((res) => {
              const branchCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
              console.log('Loaded categories for manager branch:', branchCategories);
              setCategories(branchCategories);
            }).catch((error) => {
              console.error("Error loading categories for manager branch:", error);
              setCategories([]);
            });
          } else {
            console.log('User branch not found, loading all categories');
            categoryApi.getCategories({}).then((res) => {
              const allCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
              setCategories(allCategories);
            }).catch((error) => {
              console.error("Error loading all categories:", error);
              setCategories([]);
            });
          }
        }).catch((error) => {
          console.error("Error loading branches:", error);
          setCategories([]);
        });
      } else {
        // For admins, load all categories
        console.log('Loading all categories for admin');
        categoryApi.getCategories({}).then((res) => {
          const allCategories = Array.isArray(res?.data?.data) ? res.data.data : [];
          console.log('Loaded all categories for admin:', allCategories);
          setCategories(allCategories);
        }).catch((error) => {
          console.error("Error loading categories for admin:", error);
          setCategories([]);
        });
      }
    }
  }, [initialData?.categoryId, isEditMode, isAdmin, user?.branch, initialData?.restaurantId, initialData?.branch?.restaurantId, initialData?.restaurant?.id, initialData?.branchId, initialData?.branch?.id]);

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
          unit: (ing.unit && ing.unit.trim() !== "") ? ing.unit : (inventory?.unit || "pieces"),
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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const currentTags = form.getValues("tags") || [];
      if (!currentTags.includes(tagInput.trim())) {
        form.setValue("tags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async (data: MenuItemFormValues) => {
    // Prevent default form submission
    event?.preventDefault();

    setIsSubmitting(true);
    try {
      console.log('Form data before processing:', JSON.stringify(data, null, 2));

      // Extract and remove branchId if it exists
      const { restaurantId, branchName, modifiers, ingredients, branchId, ...dataWithoutExtras } = data;

      console.log('Data after destructuring:', {
        branchName,
        hasBranchId: !!branchId,
        dataWithoutExtras: Object.keys(dataWithoutExtras)
      });

      // Find the selected branch to get its ID
      const selectedBranch = filteredBranches.find(branch => branch.name === branchName);

      // Create a clean data object with only the fields we want to send
      const formattedData: any = {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        price: Number(data.price) || 0,
        cost: Number(data.cost) || 0,
        taxRate: Number(data.taxRate) || 0,
        taxExempt: data.taxExempt,
        isActive: data.isActive,
        categoryId: data.categoryId,
        restaurantId: restaurantId, // Include restaurantId in the data sent to the API
        tags: data.tags || [],
        // Only include branchName if not global
        ...(branchName !== "global" && selectedBranch?.name && {
          branchName: selectedBranch.name
        }),
        // Handle modifiers properly
        ...(modifiers && modifiers.length > 0 && {
          modifiers: {
            connect: modifiers.map(({ id }) => ({ id }))
          }
        }),
        ingredients: {
          create: ingredients.map(ing => ({
            inventoryItemId: ing.inventoryItemId,
            quantity: ing.quantity,
            unit: ing.unit
          }))
        }
      };

      console.log('Sending to API:', JSON.stringify(formattedData, null, 2));

      if (isEditMode && initialData?.id) {
        await menuItemApi.updateItem(initialData.id, formattedData as any);
        toast({
          title: "Success",
          description: "Menu item updated successfully.",
        });
      } else {
        const response = await menuItemApi.createItem(formattedData as any);
        toast({
          title: "Success",
          description: "Menu item created successfully.",
        });
        // If creating a new item, update the URL to the edit page
        if (response?.data?.id) {
          window.history.pushState({}, '', `/dashboard/menu/items/edit/${response.data.id}`);
        }
      }

      // Call onSuccess after a short delay to allow the toast to show
      setTimeout(() => {
        onSuccess?.();
      }, 500);
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
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
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category">
                          {field.value ? categories.find(c => c.id === field.value)?.name || field.value : "Select a category"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories
                        .filter((category) => category.id && category.id.trim() !== "")
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      {categories.length === 0 && (
                        <div className="p-2 text-sm text-muted-foreground">
                          {form.watch("branchName")
                            ? "No categories found for selected branch. Please create a category first."
                            : "Please select a branch first to see available categories."
                          }
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          {/* Pricing Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax Rate</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tax rate">
                          {field.value === 0 ? "0% (No Tax)" : field.value === 20 ? "20% (VAT)" : "Select tax rate"}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">0% (No Tax)</SelectItem>
                      <SelectItem value="20">20% (VAT)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the tax rate for this menu item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Tax Exempt Switch */}
          <FormField
            control={form.control}
            name="taxExempt"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Tax Exempt</FormLabel>
                  <FormDescription>
                    This item is exempt from tax calculations.
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

          {/* Image Upload */}
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

          {/* Tags Section */}
          <div className="space-y-4">
            <FormLabel className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </FormLabel>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {form.watch("tags")?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-3 py-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add a tag and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
              />
            </div>
          </div>

          {/* Restaurant and Branch Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Restaurant Field - Hidden for managers, visible for admins */}
            {isAdmin ? (
              <FormField
                control={form.control}
                name="restaurantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restaurant *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a restaurant">
                            {field.value ? restaurants.find(r => r.id === field.value)?.name || field.value : "Select a restaurant"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {restaurants
                          .filter((restaurant) => restaurant.id && restaurant.id.trim() !== "")
                          .map((restaurant) => (
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
            ) : (
              // For managers, show the restaurant as read-only
              <FormItem>
                <FormLabel>Restaurant *</FormLabel>
                <FormControl>
                  <Input
                    value={managerRestaurant?.name || "Not assigned"}
                    disabled
                    className="bg-muted"
                  />
                </FormControl>
                <FormDescription>
                  Your assigned restaurant
                </FormDescription>
              </FormItem>
            )}

            {/* Branch Field - Hidden for managers, visible for admins */}
            {/* Branch Field - Hidden for managers, visible for admins */}
            {isAdmin ? (
              <FormField
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting || !form.watch("restaurantId")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a branch">
                            {field.value === "global"
                              ? "🌐 Global (All Branches)"
                              : field.value
                                ? filteredBranches.find(b =>
                                  b.name === field.value ||
                                  b.id === field.value
                                )?.name || field.value
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
                          filteredBranches
                            .filter((branch) => branch.id && branch.id.trim() !== "")
                            .map((branch) => (
                              <SelectItem key={branch.id} value={branch.name}> {/* Use branch.name as value */}
                                {branch.name}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            {form.watch('restaurantId') ? "No branches available for this restaurant" : "Select a restaurant first"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              // For managers, show the branch as read-only
              <FormItem>
                <FormLabel>Branch *</FormLabel>
                <FormControl>
                  <Input
                    value={managerBranch?.name || "Not assigned"}
                    disabled
                    className="bg-muted"
                  />
                </FormControl>
                <FormDescription>
                  Your assigned branch
                </FormDescription>
              </FormItem>
            )}
          </div>

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
                          {units
                            .filter((unit) => unit && unit.trim() !== "")
                            .map((unit) => (
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
                    className={`ml-2 h-4 w-4 transition-transform ${isIngredientDropdownOpen ? "rotate-180" : ""
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
            <div className="flex items-center justify-between">
              <FormLabel>Modifiers</FormLabel>
              {(form.watch("restaurantId") || form.watch("branchName")) && (
                <div className="text-sm text-muted-foreground">
                  {form.watch("branchName")
                    ? `Branch: ${form.watch("branchName")}`
                    : form.watch("restaurantId")
                      ? `Restaurant: ${restaurants.find(r => r.id === form.watch("restaurantId"))?.name || "Selected"}`
                      : ""
                  }
                </div>
              )}
            </div>
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
                  disabled={!form.watch("branchName")}
                >
                  Add Modifier
                  <ChevronDown
                    className={`ml-2 h-4 w-4 transition-transform ${isModifierDropdownOpen ? "rotate-180" : ""
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
                            : !form.watch("branchName")
                              ? "Please select a branch first to see available modifiers."
                              : "No available modifiers."}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Status */}
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