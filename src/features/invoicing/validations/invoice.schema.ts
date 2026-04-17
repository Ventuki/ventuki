import { z } from "zod";
import { rfcSchema } from "./rfc.schema";

export const invoiceSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid(),
  sale_id: z.string().uuid().nullable().optional(),
  customer_id: z.string().uuid().nullable().optional(),
  created_by: z.string().uuid(),
  payment_method: z.enum(["PUE", "PPD"]),
  payment_form: z.enum(["01", "02", "03", "04", "28", "99"]),
  fiscal_data: z.object({
    rfc: rfcSchema,
    businessName: z.string().min(2, "Razón social requerida"),
    fiscalRegime: z.string().min(3, "Régimen fiscal requerido"),
    postalCode: z.string().regex(/^\d{5}$/),
    cfdiUse: z.string().min(3),
  }),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        description: z.string().min(2),
        qty: z.number().positive(),
        price: z.number().nonnegative(),
        discount: z.number().nonnegative().optional(),
        taxes: z.array(
          z.object({
            code: z.string().min(1),
            type: z.enum(["traslado", "retencion"]),
            rate: z.number().nonnegative(),
            base: z.number().nonnegative(),
            amount: z.number(),
          }),
        ),
        total: z.number().nonnegative(),
      }),
    )
    .min(1, "Debe existir al menos un concepto"),
});
