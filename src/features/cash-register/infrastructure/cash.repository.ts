import { supabase } from "@/integrations/supabase/client";
import type { CreateSessionInput, CloseSessionInput, CashMovementInput } from "../validations/cash.schema";

export const cashRegisterRepository = {
  /** Verifica si el usuario ya tiene una sesión abierta en la sucursal */
  async getActiveSession(companyId: string, branchId: string, cashierId: string) {
    const { data: session, error } = await supabase
      .from("cash_register_sessions" as any)
      .select("*")
      .eq("company_id", companyId)
      .eq("branch_id", branchId)
      .eq("opened_by", cashierId)
      .is("closed_at", null)
      .maybeSingle();

    return { session, error };
  },

  async openSession(input: CreateSessionInput) {
    return await supabase
      .from("cash_register_sessions" as any)
      .insert({
        company_id: input.company_id,
        branch_id: input.branch_id,
        opened_by: input.cashier_user_id,
        opening_amount: input.opening_balance,
      } as any)
      .select("id")
      .single();
  },

  /** Cierra sesión y realiza arqueo */
  async closeSession(input: CloseSessionInput) {
    // 1. Obtener totales calculados a través del RPC
    const { data: summary, error: rpcError } = await supabase.rpc("calculate_cash_session_totals" as any, {
      _session_id: input.session_id,
    } as any);

    if (rpcError) return { error: rpcError };

    // 2. Determinar discrepancias
    const calculated_cash = Number(summary?.total_cash || 0);
    const calculated_card = Number(summary?.total_card || 0);
    const calculated_transfer = Number(summary?.total_transfer || 0);

    const difference =
      (input.counted_cash - calculated_cash) +
      (input.counted_card - calculated_card) +
      (input.counted_transfer - calculated_transfer);

    // 3. Cerrar sesión con datos de arqueo
    return await supabase
      .from("cash_register_sessions" as any)
      .update({
        closed_at: new Date().toISOString(),
        closed_by: input.cashier_user_id,
        closing_notes: input.notes,
        counted_cash: input.counted_cash,
        counted_card: input.counted_card,
        counted_transfer: input.counted_transfer,
        calculated_cash,
        calculated_card,
        calculated_transfer,
        difference,
      } as any)
      .eq("id", input.session_id)
      .eq("company_id", input.company_id);
  },

  async recordMovement(input: CashMovementInput) {
    return await supabase
      .from("cash_movements" as any)
      .insert({
        session_id: input.session_id,
        company_id: input.company_id,
        type: input.type,
        amount: input.amount,
        payment_method: input.payment_method,
        reference: input.reference || null,
        description: input.description,
      } as any)
      .select("id")
      .single();
  }
};
