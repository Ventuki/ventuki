// Onboarding types for the company setup wizard

export interface CompanyStepData {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  // Logo will be handled as a file upload separately
}

export interface BranchStepData {
  branchName: string;
  branchAddress: string;
  branchCity: string;
  branchState: string;
  branchZipCode: string;
  branchTimezone: string;
}

export interface WarehouseStepData {
  warehouseName: string;
  warehouseDescription: string;
}

export interface CashRegisterStepData {
  cashRegisterName: string;
  initialCash: number;
}

export interface UserStepData {
  userName: string;
  userEmail: string;
  userPassword: string;
  userRole: 'admin';
}

export interface OnboardingFormData {
  company: CompanyStepData;
  branch: BranchStepData;
  warehouse: WarehouseStepData;
  cashRegister: CashRegisterStepData;
  user: UserStepData;
}

export type OnboardingStep = 
  | 'company' 
  | 'branch' 
  | 'warehouse' 
  | 'cashRegister' 
  | 'user' 
  | 'complete';

export interface OnboardingContext {
  currentStep: OnboardingStep;
  formData: Partial<OnboardingFormData>;
  isSubmitting: boolean;
  error: string | null;
}