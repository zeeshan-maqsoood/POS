'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { productApi } from '@/lib/api';
import * as z from 'zod';

// --- Dropdown Options ---
export const foodCategories = [
  { value: 'appetizers', label: 'Appetizers' },
  { value: 'main_course', label: 'Main Course' },
  { value: 'soups', label: 'Soups' },
  { value: 'salads', label: 'Salads' },
  { value: 'desserts', label: 'Desserts' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'sides', label: 'Side Dishes' },
  { value: 'specials', label: "Chef's Specials" },
];

export const supplierOptions = [
  { value: 'local_farm', label: 'Local Farm Fresh' },
  { value: 'sysco', label: 'Sysco Food Services' },
  { value: 'gordon', label: 'Gordon Food Service' },
  { value: 'specialty_foods', label: 'Specialty Food Co.' },
];

export const taxRates = [
  { value: '20', label: '20% VAT', rate: 0.2 },
  { value: '10', label: '10% VAT', rate: 0.1 },
  { value: '0', label: '0% VAT', rate: 0 },
];

// --- Form Schema ---
const productFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string(),
  supplier: z.string().optional(),
  tillOrder: z.coerce.number().min(0, 'Till order must be 0 or greater.').default(0),
  tags: z.string().optional(),
  costPriceIncTax: z.coerce.number().min(0, 'Cost Price must be 0 or greater.'),
  salePriceExcTax: z.coerce.number().min(0.01, 'Sale Price must be greater than 0.'),
  takeAwayDeliveryPriceExcTax: z.coerce.number().min(0, 'Takeaway Price must be 0 or greater.').optional(),
  recommendedRetailPrice: z.coerce.number().min(0, 'RRP must be 0 or greater.').optional(),
  taxRate: z.string().default('20'),
  takeAwayDeliveryTaxRate: z.string().default('20'),
  taxExempt: z.boolean().default(false),
  sellOnTill: z.boolean().default(true),
  active: z.boolean().default(true),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormValues> & { id?: string };
  isEdit?: boolean;
}

export function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const defaultValues = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    barcode: initialData?.barcode || '',
    category: initialData?.category || 'main_course',
    supplier: initialData?.supplier || 'local_farm',
    tillOrder: initialData?.tillOrder || 0,
    tags: initialData?.tags || '',
    costPriceIncTax: initialData?.costPriceIncTax || 0,
    salePriceExcTax: initialData?.salePriceExcTax || 0,
    taxRate: initialData?.taxRate || '20',
    takeAwayDeliveryTaxRate: initialData?.takeAwayDeliveryTaxRate || '20',
    taxExempt: initialData?.taxExempt ?? false,
    sellOnTill: initialData?.sellOnTill ?? true,
    active: initialData?.active ?? true,
  };

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isEdit && initialData?.id) {
      const productId = initialData.id; // Store in a variable to help TypeScript with type narrowing
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await productApi.getProduct(productId);
          form.reset(response.data);
        } catch {
          setMessage({ type: 'error', text: 'Failed to load product data' });
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [isEdit, initialData?.id, form]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      setMessage(null);
      if (isEdit && initialData?.id) {
        await productApi.updateProduct(initialData.id, data);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await productApi.createProduct(data);
        setMessage({ type: 'success', text: 'Product created successfully!' });
        form.reset();
      }
      setTimeout(() => router.push('/dashboard/products'), 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>
      <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ... keep your existing form fields and layout here ... */}
      </form>
    </div>
  );
}