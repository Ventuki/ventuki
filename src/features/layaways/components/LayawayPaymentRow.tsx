import type { LayawayPayment } from "../types";
import { formatCurrency, PAYMENT_METHOD_LABELS } from "../utils";

interface LayawayPaymentRowProps {
  payment: LayawayPayment;
}

export function LayawayPaymentRow({ payment }: LayawayPaymentRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <span className="font-medium">{formatCurrency(payment.amount)}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(payment.created_at).toLocaleString("es-MX")}
          {payment.created_by_user && (
            <span className="ml-1">— {payment.created_by_user.full_name}</span>
          )}
        </div>
      </div>
    </div>
  );
}