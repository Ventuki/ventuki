import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TransferStockPanel({
  onTransfer,
  warehouseOptions,
  productOptions,
}: {
  onTransfer: (input: { from_warehouse: string; to_warehouse: string; product_id: string; qty: number; notes?: string }) => Promise<void>;
  warehouseOptions: Array<{ id: string; name: string }>;
  productOptions: Array<{ id: string; name: string }>;
}) {
  const [productSearch, setProductSearch] = useState("");
  const [form, setForm] = useState({ from_warehouse: "", to_warehouse: "", product_id: "", qty: "0", notes: "" });

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return productOptions;
    return productOptions.filter((p) => p.name.toLowerCase().includes(term));
  }, [productOptions, productSearch]);

  const selectedOrigin = warehouseOptions.find((warehouse) => warehouse.id === form.from_warehouse);
  const selectedDestination = warehouseOptions.find((warehouse) => warehouse.id === form.to_warehouse);
  const selectedProduct = productOptions.find((product) => product.id === form.product_id);
  const transferReady = Boolean(form.from_warehouse && form.to_warehouse && form.product_id && Number(form.qty) > 0);

  return (
    <div className="space-y-2 rounded-md border p-4">
      <h3 className="font-semibold">Transferencias internas</h3>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Almacén origen</Label>
          <Select value={form.from_warehouse} onValueChange={(v) => setForm((f) => ({ ...f, from_warehouse: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecciona origen" /></SelectTrigger>
            <SelectContent>
              {warehouseOptions.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Almacén destino</Label>
          <Select value={form.to_warehouse} onValueChange={(v) => setForm((f) => ({ ...f, to_warehouse: v }))}>
            <SelectTrigger><SelectValue placeholder="Selecciona destino" /></SelectTrigger>
            <SelectContent>
              {warehouseOptions.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Buscar producto</Label>
        <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Nombre producto" />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
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
        <div className="space-y-1"><Label>Cantidad</Label><Input type="number" min="0.001" step="0.001" value={form.qty} onFocus={(e) => e.target.select()} onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))} /></div>
      </div>
      <div className="space-y-1"><Label>Notas</Label><Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>

      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <p className="font-medium">Resumen previo de transferencia</p>
        {transferReady ? (
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Origen</p>
              <p className="font-medium">{selectedOrigin?.name || "Sin seleccionar"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Destino</p>
              <p className="font-medium">{selectedDestination?.name || "Sin seleccionar"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Producto</p>
              <p className="font-medium">{selectedProduct?.name || "Sin seleccionar"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cantidad</p>
              <p className="font-medium">{Number(form.qty).toFixed(3)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Completa origen, destino, producto y cantidad para revisar la transferencia antes de ejecutarla.</p>
        )}

        {form.from_warehouse && form.to_warehouse && form.from_warehouse === form.to_warehouse && (
          <p className="mt-2 text-xs text-destructive">Origen y destino no pueden ser iguales.</p>
        )}
      </div>

      <Button
        onClick={async () => onTransfer({ ...form, qty: Number(form.qty), notes: form.notes || undefined })}
        disabled={!form.from_warehouse || !form.to_warehouse || !form.product_id || Number(form.qty) <= 0}
      >
        Transferir stock
      </Button>
    </div>
  );
}
