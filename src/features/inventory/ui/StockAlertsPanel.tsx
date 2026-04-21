import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StockAlert } from "../types/inventory.types";
import { stockAlertLabel } from "../ux/feedback";

export function StockAlertsPanel({ alerts }: { alerts: StockAlert[] }) {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert key={`${alert.product_id}:${alert.warehouse_id}:${alert.severity}`}>
          <AlertTitle>{stockAlertLabel(alert.severity)}</AlertTitle>
          <AlertDescription>
            <span className="font-medium text-foreground">
              {alert.product_name || alert.product_id}
              {alert.product_sku ? ` (${alert.product_sku})` : ""}
            </span>
            {` · Almacén ${alert.warehouse_name || alert.warehouse_id} · Stock ${alert.qty.toFixed(3)} · Mínimo ${alert.min_qty.toFixed(3)}`}
            {alert.max_qty != null ? ` · Máximo ${alert.max_qty.toFixed(3)}` : ""}
          </AlertDescription>
        </Alert>
      ))}
      {alerts.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas activas.</p>}
    </div>
  );
}
