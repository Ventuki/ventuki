import { z } from "zod";

export const restockConfigSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  min_qty: z.number().min(0, "El mínimo no puede ser negativo"),
  max_qty: z.number().nullable(),
  permissions: z.array(z.enum(["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"])),
  actor_user_id: z.string().uuid().optional(),
}).refine((data) => data.max_qty == null || data.max_qty >= data.min_qty, {
  message: "El máximo no puede ser menor que el mínimo",
  path: ["max_qty"],
});

export type RestockConfigInput = z.infer<typeof restockConfigSchema>;
