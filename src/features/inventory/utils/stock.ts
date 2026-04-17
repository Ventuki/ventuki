import type { StockRow } from "@/features/inventory/services/inventoryService";

export function resolveMovementType(delta: number) {
  if (delta === 0) return null;
  return delta > 0 ? "adjustment_in" : "adjustment_out";
}

export function validateStockDelta(delta: number) {
  if (!Number.isFinite(delta)) return "Cantidad inválida";
  if (delta === 0) return "La cantidad no puede ser cero";
  return null;
}

export function buildInventoryFilter(rows: StockRow[], term: string, barcodeProductIds: string[]) {
  if (!term) return rows;
  const lower = term.toLowerCase();
  return rows.filter(
    (r) =>
      r.products?.name?.toLowerCase().includes(lower) ||
      r.products?.sku?.toLowerCase().includes(lower) ||
      barcodeProductIds.includes(r.product_id),
  );
}
