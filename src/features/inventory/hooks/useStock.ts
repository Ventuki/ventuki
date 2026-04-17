import { useMemo } from "react";
import type { StockRecord } from "../types/inventory.types";

export function useStock(rows: StockRecord[]) {
  return useMemo(
    () => ({
      totalRows: rows.length,
      totalQty: rows.reduce((acc, row) => acc + row.qty, 0),
      lowStock: rows.filter((row) => row.qty <= row.min_qty),
      maxStock: rows.filter((row) => row.max_qty != null && row.qty >= row.max_qty),
    }),
    [rows],
  );
}
