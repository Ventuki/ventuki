import { z } from "zod";

const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
const antiXssRegex = /^[^<>]*$/;

export const customerSchema = z.object({
  company_id: z.string().uuid(),
  code: z.string().optional().or(z.literal("")),
  first_name: z.string().min(1, "El nombre es obligatorio").max(100).regex(antiXssRegex, "Caracteres inválidos detectados"),
  last_name: z.string().max(100).regex(antiXssRegex, "Caracteres inválidos detectados").optional().or(z.literal("")),
  business_name: z.string().max(200).regex(antiXssRegex, "Caracteres inválidos detectados").optional().or(z.literal("")),
  tax_id: z.string()
    .toUpperCase()
    .regex(rfcRegex, "Formato de RFC invalido")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Formato de correo invalido").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerRecord = CustomerInput & {
  id: string;
  customer_type_id?: string | null;
  created_at: string;
  updated_at: string;
};
