import { z } from 'zod';

// Step 1: Company info
export const companyStepSchema = z.object({
  companyName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  companyEmail: z.string().email('Email inválido'),
  companyPhone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').max(20),
});

// Step 2: Branch info
export const branchStepSchema = z.object({
  branchName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  branchAddress: z.string().min(5, 'La dirección es requerida').max(200),
  branchCity: z.string().min(2, 'La ciudad es requerida').max(100),
  branchState: z.string().min(2, 'El estado es requerido').max(100),
  branchZipCode: z.string().min(5, 'Código postal inválido').max(10),
  branchTimezone: z.string().min(1, 'La zona horaria es requerida'),
});

// Step 3: Warehouse info
export const warehouseStepSchema = z.object({
  warehouseName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  warehouseDescription: z.string().max(500).optional().default(''),
});

// Step 4: Cash register info
export const cashRegisterStepSchema = z.object({
  cashRegisterName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(50),
  initialCash: z.number().min(0, 'El monto inicial no puede ser negativo').default(0),
});

// Step 5: Admin user info
export const userStepSchema = z.object({
  userName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  userEmail: z.string().email('Email inválido'),
  userPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe tener al menos una minúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
  userRole: z.literal('admin'),
});

// Full onboarding form
export const onboardingFormSchema = z.object({
  company: companyStepSchema,
  branch: branchStepSchema,
  warehouse: warehouseStepSchema,
  cashRegister: cashRegisterStepSchema,
  user: userStepSchema,
});

export type CompanyStepData = z.infer<typeof companyStepSchema>;
export type BranchStepData = z.infer<typeof branchStepSchema>;
export type WarehouseStepData = z.infer<typeof warehouseStepSchema>;
export type CashRegisterStepData = z.infer<typeof cashRegisterStepSchema>;
export type UserStepData = z.infer<typeof userStepSchema>;
export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;