import { z } from "zod";

export const transferSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  from_warehouse: z.string().uuid(),
  to_warehouse: z.string().uuid(),
  product_id: z.string().uuid(),
  qty: z.number().positive(),
  notes: z.string().max(400).optional(),
  permissions: z.array(z.enum(["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"])),
  actor_user_id: z.string().uuid().optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;
