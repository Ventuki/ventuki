import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export function CashSessionDetailDialog({ row, onLoadDetail }: {
  row: { id: string; opened_at: string | null; closed_at: string | null; opening_amount: number | null; difference: number | null };
  onLoadDetail: (sessionId: string) => Promise<{ session: any; totals: any; movements: any[] }>;
}) {
  const [detail, setDetail] = useState<{ session: any; totals: any; movements: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setLoading(true);
    try {
      const result = await onLoadDetail(row.id);
      setDetail(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleOpen()}>Ver detalle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalle de sesión de caja</DialogTitle>
        </DialogHeader>
        {loading || !detail ? (
          <p className="text-sm text-muted-foreground">Cargando detalle...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-md border p-3 text-sm"><p className="text-muted-foreground">Apertura</p><p className="font-medium">{detail.session?.opened_at ? new Date(detail.session.opened_at).toLocaleString("es-MX") : "-"}</p></div>
              <div className="rounded-md border p-3 text-sm"><p className="text-muted-foreground">Cierre</p><p className="font-medium">{detail.session?.closed_at ? new Date(detail.session.closed_at).toLocaleString("es-MX") : "Abierta"}</p></div>
              <div className="rounded-md border p-3 text-sm"><p className="text-muted-foreground">Efectivo esperado</p><p className="font-medium">{moneyFormatter.format(Number(detail.totals?.total_cash || 0))}</p></div>
              <div className="rounded-md border p-3 text-sm"><p className="text-muted-foreground">Diferencia final</p><p className="font-medium">{moneyFormatter.format(Number(detail.session?.difference || 0))}</p></div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Referencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">No hay movimientos ligados a esta sesión.</TableCell>
                    </TableRow>
                  ) : (
                    detail.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>{movement.created_at ? new Date(movement.created_at).toLocaleString("es-MX") : "-"}</TableCell>
                        <TableCell>{movement.type || "-"}</TableCell>
                        <TableCell>{movement.payment_method || "-"}</TableCell>
                        <TableCell className="text-right">{moneyFormatter.format(Number(movement.amount || 0))}</TableCell>
                        <TableCell>{movement.reference || movement.notes || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
