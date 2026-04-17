import type { ReactNode } from "react";

export function PaymentModal({ open, children }: { open: boolean; children: ReactNode }) {
  if (!open) return null;
  return <div className="rounded border bg-background p-4 shadow">{children}</div>;
}
