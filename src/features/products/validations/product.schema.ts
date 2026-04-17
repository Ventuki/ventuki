import { z } from "zod";

export const productUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  actor_user_id: z.string().uuid().optional(),
  permissions: z.array(z.enum(["product.create", "product.update", "product.delete"])),
  sku: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(180),
  description: z.string().max(1000).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  brand_id: z.string().uuid().nullable().optional(),
  unit_id: z.string().uuid().nullable().optional(),
  barcode: z.string().trim().max(120).optional(),
  price_list_id: z.string().uuid().optional(),
  price: z.number().min(0).max(9_999_999),
  cost: z.number().min(0).max(9_999_999),
  is_active: z.boolean(),
  manage_stock: z.boolean().optional().default(false),
  initial_stock: z.number().min(0).optional().default(0),
  warehouse_id: z.string().uuid().optional(),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
