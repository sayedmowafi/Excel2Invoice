import { z } from 'zod';

export const addressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

export const customerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: addressSchema.optional(),
  taxId: z.string().optional(),
});

export const customerInputSchema = customerSchema.extend({
  id: z.string().optional(),
});

export type AddressSchema = z.infer<typeof addressSchema>;
export type CustomerSchema = z.infer<typeof customerSchema>;
export type CustomerInputSchema = z.infer<typeof customerInputSchema>;
