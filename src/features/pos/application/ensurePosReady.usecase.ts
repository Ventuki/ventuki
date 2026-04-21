import { inventoryRepository } from "../infrastructure/inventory.repository";
import { cashRegisterRepository } from "@/features/cash-register/infrastructure/cash.repository";
import { getActivePaymentMethodsQuery, type ActivePaymentMethod } from "./queries/getActivePaymentMethods.query";

export interface EnsurePosReadyInput {
  company_id: string;
  branch_id: string;
  cashier_user_id: string;
  current_warehouse_id?: string;
}

export interface EnsurePosReadyResult {
  warehouse_id: string;
  cashSessionReady: boolean;
  warehouseReady: boolean;
  paymentConfigReady: boolean;
  paymentMethods: ActivePaymentMethod[];
}

export async function ensurePosReadyUseCase(input: EnsurePosReadyInput): Promise<EnsurePosReadyResult> {
  const [warehouseResult, cashSessionResult, paymentMethods] = await Promise.all([
    input.current_warehouse_id
      ? Promise.resolve({ data: { id: input.current_warehouse_id } })
      : inventoryRepository.getDefaultWarehouse(input.company_id, input.branch_id),
    cashRegisterRepository.getActiveSession(input.company_id, input.branch_id, input.cashier_user_id),
    getActivePaymentMethodsQuery(input.company_id),
  ]);

  if (cashSessionResult.error) {
    throw new Error("No se pudo validar el estado de caja");
  }

  const activeWarehouse = (warehouseResult.data as { id: string } | null) || null;

  return {
    warehouse_id: activeWarehouse?.id || "",
    cashSessionReady: Boolean(cashSessionResult.session),
    warehouseReady: Boolean(activeWarehouse?.id),
    paymentConfigReady: paymentMethods.length > 0,
    paymentMethods,
  };
}
