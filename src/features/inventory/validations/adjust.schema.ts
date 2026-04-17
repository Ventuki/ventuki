import { z } from "zod";

export const adjustSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  delta: z.number().refine((v) => v !== 0, "La cantidad no puede ser cero"),
  notes: z.string().max(400).optional(),
  permissions: z.array(z.enum(["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"])),
  actor_user_id: z.string().uuid().optional(),
});

export type AdjustInput = z.infer<typeof adjustSchema>;
