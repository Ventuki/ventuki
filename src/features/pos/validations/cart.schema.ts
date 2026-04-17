import { z } from "zod";

export const cartLineSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  product_name: z.string().min(1),
  sku: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(1),
  max_discount_percent: z.number().min(0).max(100),
  discount_percent: z.number().min(0).max(100),
  stock_available: z.number().nonnegative(),
});

export const cartSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  sale_id: z.string().uuid(),
  lines: z.array(cartLineSchema),
  notes: z.string().optional(),
});
