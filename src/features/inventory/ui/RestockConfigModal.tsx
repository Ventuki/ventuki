import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StockRecord } from "../types/inventory.types";

export function RestockConfigModal({ row, onSubmit }: {
  row: StockRecord;
  onSubmit: (input: { warehouse_id: string; product_id: string; min_qty: number; max_qty: number | null }) => Promise<void>;
}) {
  const [minQty, setMinQty] = useState(String(row.min_qty || 0));
  const [maxQty, setMaxQty] = useState(row.max_qty == null ? "" : String(row.max_qty));

  useEffect(() => {
    setMinQty(String(row.min_qty || 0));
    setMaxQty(row.max_qty == null ? "" : String(row.max_qty));
  }, [row]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">Configurar reabasto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar reabasto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium">{row.product_name || row.product_id}</p>
            <p className="text-muted-foreground">Almacén: {row.warehouse_name || row.warehouse_id}</p>
            <p className="text-muted-foreground">Stock actual: {row.qty.toFixed(3)}</p>
          </div>
          <div className="space-y-1">
            <Label>Mínimo</Label>
            <Input type="number" min="0" step="0.001" value={minQty} onChange={(e) => setMinQty(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Máximo</Label>
            <Input type="number" min="0" step="0.001" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="rounded-md border bg-primary/5 p-3 text-xs text-muted-foreground">
            Estos valores alimentan alertas y sugerencias de recompra. No cambian existencias actuales, solo la política de reabasto.
          </div>
          <Button
            className="w-full"
            onClick={async () => onSubmit({
              warehouse_id: row.warehouse_id,
              product_id: row.product_id,
              min_qty: Number(minQty || 0),
              max_qty: maxQty.trim() === "" ? null : Number(maxQty),
            })}
          >
            Guardar configuración
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
