import { z } from "zod";

export const createLayawayItemSchema = z.object({
  product_id: z.string().uuid("Producto inválido"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unit_price: z.number().nonnegative("El precio no puede ser negativo"),
});

export const createLayawaySchema = z.object({
  branch_id: z.string().uuid("Selecciona una sucursal"),
  customer_id: z.string().uuid("Selecciona un cliente"),
  items: z.array(createLayawayItemSchema).min(1, "Agrega al menos un producto"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

export const addPaymentSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a 0"),
  payment_method: z.enum(["cash", "card", "transfer", "mixed"]),
  payment_details: z.record(z.unknown()).optional(),
});

export const layawayFiltersSchema = z.object({
  status: z.enum(["active", "completed", "cancelled"]).optional(),
  customer_id: z.string().uuid().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});

export type CreateLayawayFormValues = z.infer<typeof createLayawaySchema>;
export type AddPaymentFormValues = z.infer<typeof addPaymentSchema>;
export type LayawayFiltersFormValues = z.infer<typeof layawayFiltersSchema>;