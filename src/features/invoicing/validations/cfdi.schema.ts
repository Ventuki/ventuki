import { z } from "zod";

export const cfdiSchema = z.object({
  postalCode: z.string().regex(/^\d{5}$/, "Código postal inválido"),
  fiscalRegime: z.string().min(3, "Régimen fiscal requerido"),
  cfdiUse: z.string().min(3, "Uso CFDI requerido"),
  payment_method: z.enum(["PUE", "PPD"]),
  payment_form: z.enum(["01", "02", "03", "04", "28", "99"]),
});
