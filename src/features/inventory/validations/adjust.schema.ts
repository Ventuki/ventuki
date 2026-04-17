import { z } from "zod";

export const adjustReasonSchema = z.enum([
  "merma",
  "robo",
  "dano",
  "conteo_fisico",
  "error_captura",
  "regularizacion",
  "otro",
]);

export const adjustSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  product_id: z.string().uuid(),
  delta: z.number().refine((v) => v !== 0, "La cantidad no puede ser cero"),
  reason: adjustReasonSchema,
  notes: z.string().max(400).min(5, "Agrega una nota breve del ajuste").optional(),
  permissions: z.array(z.enum(["inventory.view", "inventory.adjust", "inventory.transfer", "inventory.kardex"])),
  actor_user_id: z.string().uuid().optional(),
});

export type AdjustInput = z.infer<typeof adjustSchema>;
