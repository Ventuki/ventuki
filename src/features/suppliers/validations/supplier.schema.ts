import { z } from "zod";

const rfcRegex = /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/;

export const supplierFormSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  code: z.string().max(50).optional().or(z.literal("")),
  name: z.string().min(3, "El nombre/razón social debe tener al menos 3 caracteres").max(200),
  contact_name: z.string().max(150).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  email: z.string().email("Formato de correo inválido").optional().or(z.literal("")),
  tax_id: z.string().toUpperCase().regex(rfcRegex, "Formato de RFC inválido para México").optional().or(z.literal("")),
  address: z.string().max(400).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
  payment_terms_days: z.number().int().min(0).max(365).default(0),
  commercial_status: z.enum(["active", "blocked", "review"]).default("active"),
  is_active: z.boolean().default(true),
});

export type SupplierFormInput = z.infer<typeof supplierFormSchema>;
