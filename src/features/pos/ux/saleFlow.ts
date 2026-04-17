export type SaleFlowState = "idle" | "searching" | "cart_ready" | "paying" | "completed" | "error";

export interface SaleFlowContext {
  state: SaleFlowState;
  message?: string;
}

export const nextSaleFlowState = (current: SaleFlowState, event: "ADD_ITEM" | "OPEN_PAYMENT" | "COMPLETE" | "RESET" | "FAIL"): SaleFlowState => {
  const transitions: Record<SaleFlowState, Partial<Record<typeof event, SaleFlowState>>> = {
    idle: { ADD_ITEM: "cart_ready" },
    searching: { ADD_ITEM: "cart_ready", RESET: "idle" },
    cart_ready: { OPEN_PAYMENT: "paying", RESET: "idle", FAIL: "error" },
    paying: { COMPLETE: "completed", FAIL: "error" },
    completed: { RESET: "idle" },
    error: { RESET: "idle" },
  };

  return transitions[current][event] ?? current;
};
