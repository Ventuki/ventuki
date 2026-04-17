import { z } from "zod";

export const stockQuerySchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  warehouse_id: z.string().optional(),
  search: z.string().optional(),
  include_cedis: z.boolean().optional(),
  permissions: z.array(z.enum(["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"])),
});

export type StockFilters = z.infer<typeof stockQuerySchema>;

export const reserveSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  qty: z.number().positive(),
  notes: z.string().optional(),
  permissions: z.array(z.enum(["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"])),
  actor_user_id: z.string().uuid().optional(),
});
