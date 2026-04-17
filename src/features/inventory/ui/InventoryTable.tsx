import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StockRecord } from "../types/inventory.types";

export function InventoryTable({ rows }: { rows: StockRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Sucursal</TableHead>
          <TableHead>Almacén</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead className="text-right">Reservado</TableHead>
          <TableHead className="text-right">Mín</TableHead>
          <TableHead className="text-right">Máx</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.product_name || row.product_id}</TableCell>
            <TableCell>{row.product_sku || "-"}</TableCell>
            <TableCell>{row.branch_name || row.branch_id || "-"}</TableCell>
            <TableCell>{row.warehouse_name || row.warehouse_id}</TableCell>
            <TableCell className="text-right">{row.qty.toFixed(3)}</TableCell>
            <TableCell className="text-right">{row.reserved_qty.toFixed(3)}</TableCell>
            <TableCell className="text-right">{row.min_qty.toFixed(3)}</TableCell>
            <TableCell className="text-right">{row.max_qty?.toFixed(3) || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
