import { z } from "zod";

/** ★ FASE2 FIX #7: tax_rate acepta 0-100 (porcentaje) y se normaliza a fracción en el transform */
export const purchaseItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unit_cost: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(100),
}).transform((data) => ({
  ...data,
  tax_rate: data.tax_rate / 100, // Normalizar: 16 → 0.16 para BD
}));

export const purchaseSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  actor_user_id: z.string().uuid(),
  supplier_id: z.string().uuid(),
  folio: z.string().max(50).optional(),
  expected_date: z.string().optional(),
  notes: z.string().max(500).optional(),
  items: z.array(purchaseItemSchema).min(1, "Debe agregar al menos un producto a la orden"),
});

export type CreatePurchaseInput = z.infer<typeof purchaseSchema>;
export type PurchaseItemInput = z.infer<typeof purchaseItemSchema>;

export const receivePurchaseItemSchema = z.object({
  purchase_item_id: z.string().uuid(),
  quantity_received: z.number().nonnegative(),
});

export const receivePurchaseSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  actor_user_id: z.string().uuid(),
  purchase_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
  items: z.array(receivePurchaseItemSchema),
});

export type ReceivePurchaseInput = z.infer<typeof receivePurchaseSchema>;
