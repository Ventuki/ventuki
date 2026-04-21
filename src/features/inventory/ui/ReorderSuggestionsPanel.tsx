import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { StockAlert, StockRecord } from "../types/inventory.types";
import type { PurchaseItemDraft } from "@/features/purchases/services/purchaseService";

function rowKey(row: Pick<StockRecord, "product_id" | "warehouse_id">) {
  return `${row.product_id}:${row.warehouse_id}`;
}

export function ReorderSuggestionsPanel({ alerts, rows, onCreateDraft }: { alerts: StockAlert[]; rows: StockRecord[]; onCreateDraft: (items: PurchaseItemDraft[], meta: { source: string; item_count: number; products: Array<{ product_id: string; warehouse_id: string; suggested_qty: number }> }) => Promise<void>; }) {
  const lowAlerts = alerts.filter((alert) => alert.severity === "low");

  const suggestions = lowAlerts.map((alert) => {
    const row = rows.find((candidate) => rowKey(candidate) === rowKey(alert));
    return {
      ...alert,
      product_name: row?.product_name || alert.product_id,
      product_sku: row?.product_sku || null,
      warehouse_name: row?.warehouse_name || alert.warehouse_id,
      suggested_qty: alert.max_qty != null ? Math.max(0, alert.max_qty - alert.qty) : Math.max(alert.min_qty - alert.qty, 0),
    };
  });

  const sendToPurchases = async () => {
    const payload: PurchaseItemDraft[] = suggestions.map((item) => ({
      product_id: item.product_id,
      quantity: item.suggested_qty > 0 ? item.suggested_qty : item.min_qty,
      unit_cost: 0,
      tax_rate: 0,
    }));

    await onCreateDraft(payload, {
      source: "inventory.restock_suggestion",
      item_count: payload.length,
      products: suggestions.map((item) => ({
        product_id: item.product_id,
        warehouse_id: item.warehouse_id,
        suggested_qty: item.suggested_qty > 0 ? item.suggested_qty : item.min_qty,
      })),
    });
    toast.success(`Se creó un draft de recompra con ${payload.length} producto(s). Revísalo y complétalo en Compras.`);
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">Sugerencias de recompra</h3>
          <p className="text-sm text-muted-foreground">
            Productos en o por debajo del mínimo para considerar nueva compra o reabasto.
          </p>
        </div>
        {suggestions.length > 0 && (
          <Button type="button" variant="outline" onClick={() => void sendToPurchases()}>
            Crear draft de compra
          </Button>
        )}
      </div>

      {suggestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay productos en mínimo para reabastecer.</p>
      ) : (
        <div className="space-y-2">
          {suggestions.map((item) => (
            <div key={`${item.product_id}:${item.warehouse_id}`} className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{item.product_name}{item.product_sku ? ` (${item.product_sku})` : ""}</p>
              <p className="text-muted-foreground">Almacén: {item.warehouse_name}</p>
              <p>Stock actual: <span className="font-medium">{item.qty.toFixed(3)}</span></p>
              <p>Mínimo: <span className="font-medium">{item.min_qty.toFixed(3)}</span></p>
              <p>Sugerencia de recompra: <span className="font-medium">{item.suggested_qty.toFixed(3)}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
