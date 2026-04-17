import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdjustInventoryModal({ onSubmit, warehouseOptions, productOptions }: {
  onSubmit: (input: { warehouse_id: string; product_id: string; delta: number; reason: "merma" | "robo" | "dano" | "conteo_fisico" | "error_captura" | "regularizacion" | "otro"; notes?: string }) => Promise<void>;
  warehouseOptions: Array<{ id: string; name: string }>;
  productOptions: Array<{ id: string; name: string }>;
}) {
  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState({ warehouse_id: "", product_id: "", delta: "0", reason: "regularizacion", notes: "" });

  useEffect(() => {
    if (!form.warehouse_id && warehouseOptions[0]?.id) {
      setForm((prev) => ({ ...prev, warehouse_id: warehouseOptions[0].id }));
    }
  }, [warehouseOptions, form.warehouse_id]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return productOptions;
    return productOptions.filter((p) => p.name.toLowerCase().includes(term));
  }, [productOptions, productSearch]);

  return (
    <Dialog>
      <DialogTrigger asChild><Button>Ajuste inventario</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Ajustar inventario</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Buscar producto</Label>
            <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Nombre producto" />
          </div>

          <div className="space-y-1">
            <Label>Producto</Label>
            <Select value={form.product_id} onValueChange={(v) => setForm((f) => ({ ...f, product_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecciona producto" /></SelectTrigger>
              <SelectContent>
                {filteredProducts.map((product) => (
                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Almacén</Label>
            <Select value={form.warehouse_id} onValueChange={(v) => setForm((f) => ({ ...f, warehouse_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecciona almacén" /></SelectTrigger>
              <SelectContent>
                {warehouseOptions.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1"><Label>Ajuste de cantidad</Label><Input type="number" value={form.delta} onFocus={(e) => e.target.select()} onChange={(e) => setForm((f) => ({ ...f, delta: e.target.value }))} /></div>
          <div className="space-y-1">
            <Label>Motivo del ajuste</Label>
            <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="merma">Merma</SelectItem>
                <SelectItem value="robo">Robo</SelectItem>
                <SelectItem value="dano">Daño</SelectItem>
                <SelectItem value="conteo_fisico">Conteo físico</SelectItem>
                <SelectItem value="error_captura">Error de captura</SelectItem>
                <SelectItem value="regularizacion">Regularización</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Notas</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Describe brevemente por qué haces este ajuste" /></div>
          <div className="rounded-md border bg-amber-50 p-3 text-xs text-amber-900">
            Usa ajuste solo para correcciones extraordinarias. Si lo correcto es una recepción, transferencia o conteo físico, usa ese flujo en lugar de este ajuste manual.
          </div>
          <Button
            className="w-full"
            onClick={async () => onSubmit({ warehouse_id: form.warehouse_id, product_id: form.product_id, delta: Number(form.delta), reason: form.reason as any, notes: form.notes || undefined })}
            disabled={!form.product_id || !form.warehouse_id || !form.notes.trim()}
          >
            Aplicar ajuste
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
