import { useMemo } from "react";
import type { StockAlert, StockRecord } from "../types/inventory.types";

export function useStockAlerts(rows: StockRecord[]): StockAlert[] {
  return useMemo(() => {
    const alerts: StockAlert[] = [];
    for (const row of rows) {
      if (row.qty <= row.min_qty) {
        alerts.push({ product_id: row.product_id, warehouse_id: row.warehouse_id, qty: row.qty, min_qty: row.min_qty, max_qty: row.max_qty, severity: "low" });
      } else if (row.max_qty != null && row.qty >= row.max_qty) {
        alerts.push({ product_id: row.product_id, warehouse_id: row.warehouse_id, qty: row.qty, min_qty: row.min_qty, max_qty: row.max_qty, severity: "overflow" });
      }
    }
    return alerts.slice(0, 20);
  }, [rows]);
}
