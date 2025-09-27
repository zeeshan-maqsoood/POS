"use client"

import * as React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save, X, Plus, Trash2 } from "lucide-react"
import { Modifier, modifierApi } from "@/lib/menu-api"
import { v4 as uuidv4 } from 'uuid'

const modifierOptionSchema = z.object({
  id: z.string().default(() => uuidv4()),
  name: z.string().min(1, "Option name is required"),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

const modifierFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price cannot be negative").default(0),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

type ModifierFormValues = z.infer<typeof modifierFormSchema>

interface ModifierFormProps {
  initialData?: Modifier
  onSuccess?: () => void
  onCancel?: () => void
}

export function ModifierForm({ initialData, onSuccess, onCancel }: ModifierFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()

  const form = useForm<ModifierFormValues>({
    resolver: zodResolver(modifierFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      isRequired: initialData?.isRequired || false,
      isActive: initialData?.isActive ?? true,
    },
  })







  const onSubmit = async (data: ModifierFormValues) => {
    try {
      setIsLoading(true)
      
      if (initialData) {
        // Update existing modifier
        await modifierApi.updateModifier(initialData.id, data)
        toast({
          title: "Success",
          description: "Modifier updated successfully.",
        })
      } else {
        console.log(data,"data")
        // Create new modifier
        await modifierApi.createModifier(data)
        toast({
          title: "Success",
          description: "Modifier created successfully.",
        })
      }
      
      onSuccess?.()
      router.refresh()
      router.push("/dashboard/menu/modifiers")
    } catch (error) {
      console.error("Error saving modifier:", error)
      toast({
        title: "Error",
        description: "Failed to save modifier. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }


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
                    <Input placeholder="e.g., Extra Cheese" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A short description of this modifier"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

       

            <FormField
              control={form.control}
              name="isRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Required</FormLabel>
                    <FormDescription>
                      Is this modifier required when ordering?
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

          {/* Modifier Options */}
          {/* <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Options</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addOption}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Option {index + 1}</h4>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name={`options.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Extra Cheese" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`options.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">$</span>
                              </div>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="pl-7"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`options.${index}.isDefault`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col justify-end h-full">
                          <FormLabel>Default Selection</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`default-${index}`}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <label
                                htmlFor={`default-${index}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {field.value ? 'Yes' : 'No'}
                              </label>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
              {form.formState.errors.options && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.options.message}
                </p>
              )}
            </div>
          </div> */}
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {initialData ? 'Save Changes' : 'Create Modifier'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
