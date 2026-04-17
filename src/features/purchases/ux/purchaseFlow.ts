export type PurchaseStatus = "draft" | "confirmed" | "partial" | "received" | "cancelled";

const transitions: Record<PurchaseStatus, PurchaseStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["partial", "received", "cancelled"],
  partial: ["received", "cancelled"],
  received: [],
  cancelled: ["draft"],
};

export function canTransitionPurchase(from: PurchaseStatus, to: PurchaseStatus) {
  return transitions[from].includes(to);
}
