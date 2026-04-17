import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  cancelPurchase,
  confirmPurchase,
  createDirectPurchase,
  getPendingPurchaseItems,
  listPurchases,
  loadPurchaseMeta,
  PurchaseItemDraft,
  PurchaseRow,
  receivePurchase,
  reopenPurchase,
} from "@/features/purchases/services/purchaseService";
import { purchaseSchema } from "@/features/purchases/validations/purchase.schema";
import { canTransitionPurchase, type PurchaseStatus } from "@/features/purchases/ux/purchaseFlow";

interface Option {
  id: string;
  name: string;
  sku?: string;
}

const itemBase = { product_id: "", quantity: 1, unit_cost: 0, tax_rate: 0 };

type IncidenceType = "ok" | "faltante" | "dano" | "sobrante";

export default function PurchasesPage() {
  const { company, user } = useAuth();
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [warehouses, setWarehouses] = useState<Option[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);

  const [branchId, setBranchId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [folio, setFolio] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemDraft[]>([{ ...itemBase }]);
  const [saving, setSaving] = useState(false);

  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");
  const [receiptItems, setReceiptItems] = useState<Array<any>>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [receiving, setReceiving] = useState(false);

  const canCreate = useMemo(() => branchId && supplierId && warehouseId && items.every((i) => i.product_id && i.quantity > 0), [branchId, supplierId, warehouseId, items]);
  const selectedPurchase = useMemo(() => purchases.find((p) => p.id === selectedPurchaseId), [purchases, selectedPurchaseId]);

  const loadMeta = async () => {
    if (!company?.id) return;
    const meta = await loadPurchaseMeta(company.id);
    if (meta.error) {
      toast.error(meta.error.message);
      return;
    }

    setSuppliers(meta.suppliers as Option[]);
    setProducts(meta.products as Option[]);
    setBranches(meta.branches as Option[]);
    setWarehouses(meta.warehouses as Option[]);

    if (!branchId && meta.branches.length > 0) setBranchId((meta.branches[0] as Option).id);
    if (!warehouseId && meta.warehouses.length > 0) setWarehouseId((meta.warehouses[0] as Option).id);
  };

  const loadPurchases = async () => {
    if (!company?.id) return;
    const { data, error } = await listPurchases(company.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPurchases(data);
  };

  useEffect(() => {
    loadMeta();
    loadPurchases();
  }, [company?.id]);

  useEffect(() => {
    if (!selectedPurchaseId) return;
    (async () => {
      const { data, error } = await getPendingPurchaseItems(selectedPurchaseId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setReceiptItems((data || []).map((row: any) => ({ ...row, receive_now: 0, incidence_type: "ok" as IncidenceType, incidence_notes: "" })));
    })();
  }, [selectedPurchaseId]);

  const setItemAt = (index: number, patch: Partial<PurchaseItemDraft>) => {
    setItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...itemBase }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, idx) => idx !== index));

  const onCreatePurchase = async () => {
    if (!company?.id || !branchId || !supplierId || !warehouseId || !user?.id) {
      toast.error("Completa empresa, sucursal, proveedor y almacén destino");
      return;
    }

    setSaving(true);
    const { data, error } = await createDirectPurchase({
      companyId: company.id,
      branchId,
      supplierId,
      warehouseId,
      userId: user.id,
      invoiceNumber: folio,
      items: items.filter((i) => i.product_id),
    });
    setSaving(false);

    if (error || !data) {
      toast.error(error?.message || "No se pudo crear la compra");
      return;
    }

    toast.success("Compra directa registrada exitosamente (Stock actualizado)");
    setFolio("");
    setExpectedDate("");
    setNotes("");
    setItems([{ ...itemBase }]);
    if (data.purchase_id) {
      setSelectedPurchaseId(data.purchase_id);
    }
    loadPurchases();
  };

  const onConfirmPurchase = async () => {
    if (!company?.id || !selectedPurchaseId) return;
    const { error } = await confirmPurchase(selectedPurchaseId, company.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compra confirmada");
    loadPurchases();
  };

  const onCancelPurchase = async () => {
    if (!company?.id || !selectedPurchaseId) return;
    const { error } = await cancelPurchase(selectedPurchaseId, company.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compra cancelada");
    loadPurchases();
  };

  const onReopenPurchase = async () => {
    if (!company?.id || !selectedPurchaseId) return;
    const { error } = await reopenPurchase(selectedPurchaseId, company.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compra reabierta en draft");
    loadPurchases();
  };

  const onReceivePurchase = async () => {
    if (!selectedPurchaseId || !warehouseId) {
      toast.error("Selecciona compra y almacén");
      return;
    }

    if (!selectedPurchase || (!canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "partial") && !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "received"))) {
      toast.error("Solo compras confirmadas/parciales pueden recibirse");
      return;
    }

    const payload = receiptItems
      .filter((row) => Number(row.receive_now) > 0)
      .map((row) => ({ purchase_item_id: row.id as string, quantity_received: Number(row.receive_now) }));

    if (payload.length === 0) {
      toast.error("Captura cantidades a recibir");
      return;
    }

    const incidentLog = receiptItems
      .filter((row) => Number(row.receive_now) > 0)
      .map((row) => ({
        purchase_item_id: row.id,
        incidence_type: row.incidence_type as IncidenceType,
        notes: row.incidence_notes || null,
      }));

    setReceiving(true);
    const { error } = await receivePurchase({
      purchaseId: selectedPurchaseId,
      warehouseId,
      notes: JSON.stringify({ source: "ui-phase-b", incidents: incidentLog }),
      items: payload,
    });
    setReceiving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Recepción registrada; inventario y movimientos actualizados");
    loadPurchases();

    const updated = await getPendingPurchaseItems(selectedPurchaseId);
    if (!updated.error) {
      setReceiptItems((updated.data || []).map((row: any) => ({ ...row, receive_now: 0, incidence_type: "ok", incidence_notes: "" })));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compras y Entradas</h1>
          <p className="text-muted-foreground">Fase B: draft → confirmed → recepción parcial/total → cancel/reopen.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Nueva orden de compra</CardTitle>
              <CardDescription>Se crea en draft y se confirma después.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sucursal</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona sucursal" /></SelectTrigger>
                    <SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                    <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Almacén destino</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona almacén" /></SelectTrigger>
                    <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Folio / Factura</Label>
                  <Input value={folio} onChange={(e) => setFolio(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div className="grid grid-cols-12 gap-2" key={idx}>
                    <div className="col-span-6">
                      <Select value={item.product_id || "none"} onValueChange={(v) => setItemAt(idx, { product_id: v === "none" ? "" : v })}>
                        <SelectTrigger><SelectValue placeholder="Producto" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar</SelectItem>
                          {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2"><Input type="number" min="0.001" step="0.001" value={item.quantity} onChange={(e) => setItemAt(idx, { quantity: Number(e.target.value) })} /></div>
                    <div className="col-span-2"><Input type="number" min="0" step="0.0001" value={item.unit_cost} onChange={(e) => setItemAt(idx, { unit_cost: Number(e.target.value) })} /></div>
                    <div className="col-span-1"><Input type="number" min="0" step="0.0001" value={item.tax_rate} onChange={(e) => setItemAt(idx, { tax_rate: Number(e.target.value) })} /></div>
                    <div className="col-span-1"><Button variant="destructive" size="sm" onClick={() => removeItem(idx)}>X</Button></div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={addItem}>Agregar ítem</Button>
                <Button onClick={onCreatePurchase} disabled={saving || !canCreate}>{saving ? "Guardando..." : "Crear draft"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recepción de mercancía</CardTitle>
              <CardDescription>Recepción parcial/total con incidencias estructuradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Compra</Label>
                  <Select value={selectedPurchaseId} onValueChange={setSelectedPurchaseId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona compra" /></SelectTrigger>
                    <SelectContent>
                      {purchases.map((p) => <SelectItem key={p.id} value={p.id}>{p.folio || p.id.slice(0, 8)} · {p.status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Almacén</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona almacén" /></SelectTrigger>
                    <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={onConfirmPurchase} disabled={!selectedPurchaseId || !selectedPurchase || !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "confirmed")}>Confirmar</Button>
                <Button variant="destructive" onClick={onCancelPurchase} disabled={!selectedPurchaseId || !selectedPurchase || !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "cancelled")}>Cancelar</Button>
                <Button variant="secondary" onClick={onReopenPurchase} disabled={!selectedPurchaseId || !selectedPurchase || !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "draft")}>Reabrir</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Recibir ahora</TableHead>
                    <TableHead>Incidencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receiptItems.map((row) => {
                    const pending = Number(row.quantity) - Number(row.received_qty);
                    return (
                      <TableRow key={row.id}>
                        <TableCell>{row.products?.name || row.products?.sku || "Producto"}</TableCell>
                        <TableCell>{pending.toFixed(3)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max={pending}
                            step="0.001"
                            value={row.receive_now}
                            onChange={(e) => {
                              const val = Math.min(Number(e.target.value), pending);
                              setReceiptItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, receive_now: val } : r)));
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <Select
                              value={row.incidence_type}
                              onValueChange={(v) => setReceiptItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, incidence_type: v } : r)))}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ok">Sin incidencia</SelectItem>
                                <SelectItem value="faltante">Faltante</SelectItem>
                                <SelectItem value="dano">Daño</SelectItem>
                                <SelectItem value="sobrante">Sobrante</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Notas incidencia"
                              value={row.incidence_notes}
                              onChange={(e) => setReceiptItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, incidence_notes: e.target.value } : r)))}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Button onClick={onReceivePurchase} disabled={receiving || !selectedPurchaseId}>{receiving ? "Registrando..." : "Registrar recepción"}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
