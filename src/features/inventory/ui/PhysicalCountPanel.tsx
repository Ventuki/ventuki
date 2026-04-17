import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPhysicalCount, getPhysicalCountItems, listRecentPhysicalCounts, postPhysicalCount } from "../services/physicalCountService";

interface PhysicalCountPanelProps {
  companyId?: string;
  branchId?: string;
  userId?: string;
  warehouseOptions: Array<{ id: string; name: string }>;
  productOptions: Array<{ id: string; name: string }>;
}

interface CountLineDraft {
  product_id: string;
  counted_qty: number;
}

const emptyLine = (): CountLineDraft => ({ product_id: "", counted_qty: 0 });

export function PhysicalCountPanel({ companyId, branchId, userId, warehouseOptions, productOptions }: PhysicalCountPanelProps) {
  const [folio, setFolio] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<CountLineDraft[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [previewCountId, setPreviewCountId] = useState<string | null>(null);
  const [previewItems, setPreviewItems] = useState<Array<{
    id: string;
    system_qty: number;
    counted_qty: number;
    difference_qty: number | null;
    products?: { name?: string | null; sku?: string | null } | null;
  }>>([]);
  const [recent, setRecent] = useState<Array<{ id: string; folio: string; status: string; created_at: string }>>([]);

  const loadRecent = useCallback(async () => {
    if (!companyId) return;
    const { data, error } = await listRecentPhysicalCounts(companyId, warehouseId || undefined);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRecent((data || []) as Array<{ id: string; folio: string; status: string; created_at: string }>);
  }, [companyId, warehouseId]);

  useEffect(() => {
    if (!warehouseId && warehouseOptions.length > 0) {
      setWarehouseId(warehouseOptions[0].id);
    }
  }, [warehouseId, warehouseOptions]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const setLine = (index: number, patch: Partial<CountLineDraft>) => {
    setLines((prev) => prev.map((line, idx) => (idx === index ? { ...line, ...patch } : line)));
  };

  const onSave = async () => {
    if (!companyId || !branchId || !warehouseId) {
      toast.error("Falta contexto de empresa/sucursal/almacén");
      return;
    }

    const cleanFolio = folio.trim();
    if (!cleanFolio) {
      toast.error("Captura folio de conteo");
      return;
    }

    const validLines = lines.filter((line) => line.product_id && line.counted_qty >= 0);
    if (validLines.length === 0) {
      toast.error("Agrega al menos un producto al conteo");
      return;
    }

    setSaving(true);
    const { error } = await createPhysicalCount({
      company_id: companyId,
      branch_id: branchId,
      warehouse_id: warehouseId,
      folio: cleanFolio,
      notes,
      counted_by: userId,
      items: validLines,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Conteo físico guardado");
    setFolio("");
    setNotes("");
    setLines([emptyLine()]);
    loadRecent();
  };

  const onPost = async (countId: string) => {
    if (!companyId) return;
    setPostingId(countId);
    const { data, error } = await postPhysicalCount(companyId, countId);
    setPostingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const adjustedLines = Number((data as { adjusted_lines?: number } | null)?.adjusted_lines || 0);
    toast.success(`Conteo publicado. Partidas ajustadas: ${adjustedLines}`);
    if (previewCountId === countId) {
      setPreviewCountId(null);
      setPreviewItems([]);
    }
    loadRecent();
  };

  const onPreviewPost = async (countId: string) => {
    if (!companyId) return;
    setLoadingPreviewId(countId);
    const { data, error } = await getPhysicalCountItems(companyId, countId);
    setLoadingPreviewId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPreviewCountId(countId);
    setPreviewItems((data || []) as Array<{
      id: string;
      system_qty: number;
      counted_qty: number;
      difference_qty: number | null;
      products?: { name?: string | null; sku?: string | null } | null;
    }>);
  };

  return (
    <div className="space-y-3 rounded-md border p-4">
      <h3 className="font-semibold">Conteo físico</h3>
      <p className="text-sm text-muted-foreground">Registra folios de conteo y partidas para conciliación de inventario.</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Folio</Label>
          <Input value={folio} onChange={(e) => setFolio(e.target.value)} placeholder="CNT-0001" />
        </div>
        <div className="space-y-1">
          <Label>Almacén</Label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger><SelectValue placeholder="Selecciona almacén" /></SelectTrigger>
            <SelectContent>
              {warehouseOptions.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Partidas</Label>
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2">
            <Select value={line.product_id} onValueChange={(value) => setLine(idx, { product_id: value })}>
              <SelectTrigger className="col-span-2"><SelectValue placeholder="Producto" /></SelectTrigger>
              <SelectContent>
                {productOptions.map((product) => (
                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min="0"
              step="0.001"
              value={line.counted_qty}
              onChange={(e) => setLine(idx, { counted_qty: Number(e.target.value) || 0 })}
              placeholder="Cantidad"
            />
          </div>
        ))}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setLines((prev) => [...prev, emptyLine()])}>Agregar partida</Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLines((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))}
          >
            Quitar última
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observaciones del conteo" />
      </div>

      <Button type="button" onClick={onSave} disabled={saving}>{saving ? "Guardando..." : "Guardar conteo"}</Button>

      <div className="space-y-1 border-t pt-3">
        <Label>Conteos recientes</Label>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin conteos registrados.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recent.map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded bg-muted/40 px-2 py-1 gap-2">
                <div>
                  <span className="font-medium">{row.folio}</span>
                  <span className="block text-xs text-muted-foreground">{row.status} · {new Date(row.created_at).toLocaleDateString()}</span>
                </div>
                {row.status === "draft" ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => onPreviewPost(row.id)}
                      disabled={loadingPreviewId === row.id}
                    >
                      {loadingPreviewId === row.id ? "Cargando..." : "Revisar"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onPost(row.id)}
                      disabled={postingId === row.id}
                    >
                      {postingId === row.id ? "Publicando..." : "Publicar"}
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Aplicado</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {previewCountId && (
        <div className="space-y-2 border-t pt-3">
          <Label>Previa de diferencias del conteo</Label>
          {previewItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este conteo no tiene partidas.</p>
          ) : (
            <div className="space-y-1 text-sm">
              {previewItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 rounded bg-muted/40 px-2 py-1">
                  <div className="col-span-6 font-medium">
                    {item.products?.name || item.id}
                    {item.products?.sku ? <span className="ml-1 text-xs text-muted-foreground">({item.products.sku})</span> : null}
                  </div>
                  <div className="col-span-2 text-right">Sist: {Number(item.system_qty || 0).toFixed(3)}</div>
                  <div className="col-span-2 text-right">Cont: {Number(item.counted_qty || 0).toFixed(3)}</div>
                  <div className="col-span-2 text-right font-semibold">Δ {Number(item.difference_qty || 0).toFixed(3)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" onClick={() => onPost(previewCountId)} disabled={postingId === previewCountId}>
              {postingId === previewCountId ? "Publicando..." : "Confirmar publicación"}
            </Button>
            <Button type="button" variant="outline" onClick={() => { setPreviewCountId(null); setPreviewItems([]); }}>
              Cerrar previa
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
