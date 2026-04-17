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
            Producto {alert.product_id} / Almacén {alert.warehouse_id} · Stock {alert.qty.toFixed(3)} · Mínimo {alert.min_qty.toFixed(3)}
          </AlertDescription>
        </Alert>
      ))}
      {alerts.length === 0 && <p className="text-sm text-muted-foreground">Sin alertas activas.</p>}
    </div>
  );
}
