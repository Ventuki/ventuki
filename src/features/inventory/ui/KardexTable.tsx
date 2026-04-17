import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { MovementRecord } from "../types/movement.types";

export function KardexTable({ rows }: { rows: MovementRecord[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Almacén</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Cantidad</TableHead>
          <TableHead>Referencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{new Date(row.created_at).toLocaleString()}</TableCell>
            <TableCell>{row.product_name || row.product_id}</TableCell>
            <TableCell>{row.warehouse_name || row.warehouse_id}</TableCell>
            <TableCell>{row.type}</TableCell>
            <TableCell className="text-right">{row.qty.toFixed(3)}</TableCell>
            <TableCell>{row.reference || "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
