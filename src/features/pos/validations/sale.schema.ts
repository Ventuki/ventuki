import { z } from "zod";

export const saleSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  cashier_user_id: z.string().uuid(),
  customer_id: z.string().uuid().nullable().optional(),
  invoice_requested: z.boolean().default(false),
});
