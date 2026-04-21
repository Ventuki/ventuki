import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CashSessionDetailDialog } from "./CashSessionDetailDialog";

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function RecentSessionsPanel({ rows, onLoadDetail }: { rows: Array<{ id: string; opened_at: string | null; closed_at: string | null; opening_amount: number | null; difference: number | null; status?: string | null }>; onLoadDetail: (sessionId: string) => Promise<{ session: any; totals: any; movements: any[] }>; }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial reciente de caja</CardTitle>
        <CardDescription>Últimas sesiones para revisar aperturas, cierres y diferencias.</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay sesiones recientes para mostrar.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead className="text-right">Fondo inicial</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.opened_at ? new Date(row.opened_at).toLocaleString("es-MX") : "-"}</TableCell>
                  <TableCell>{row.closed_at ? new Date(row.closed_at).toLocaleString("es-MX") : "Abierta"}</TableCell>
                  <TableCell className="text-right">{moneyFormatter.format(Number(row.opening_amount || 0))}</TableCell>
                  <TableCell className={`text-right font-medium ${Number(row.difference || 0) === 0 ? "text-success" : "text-warning"}`}>
                    {moneyFormatter.format(Number(row.difference || 0))}
                  </TableCell>
                  <TableCell>{row.closed_at ? "Cerrada" : "Abierta"}</TableCell>
                  <TableCell className="text-right">
                    <CashSessionDetailDialog row={row} onLoadDetail={onLoadDetail} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
