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
  createDraftPurchase,
  getPendingPurchaseItems,
  getPurchaseDraftDetail,
  listPurchases,
  loadPurchaseMeta,
  PurchaseItemDraft,
  PurchaseRow,
  receivePurchase,
  reopenPurchase,
  suggestSupplierForProducts,
  updateDraftPurchase,
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
  const [suggestedSupplierName, setSuggestedSupplierName] = useState<string | null>(null);
  const [loadedFromReorder, setLoadedFromReorder] = useState(false);
  const [loadedReorderCount, setLoadedReorderCount] = useState(0);
  const [editingDraftId, setEditingDraftId] = useState("");

  const [selectedPurchaseId, setSelectedPurchaseId] = useState("");
  const [receiptItems, setReceiptItems] = useState<Array<any>>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [receiving, setReceiving] = useState(false);

  const canCreate = useMemo(() => branchId && supplierId && items.every((i) => i.product_id && i.quantity > 0), [branchId, supplierId, items]);
  const selectedPurchase = useMemo(() => purchases.find((p) => p.id === selectedPurchaseId), [purchases, selectedPurchaseId]);

  const receiptSummary = useMemo(() => {
    const totalLines = receiptItems.length;
    const linesWithPending = receiptItems.filter((row) => Number(row.quantity) - Number(row.received_qty) > 0).length;
    const linesCompleted = receiptItems.filter((row) => Number(row.quantity) - Number(row.received_qty) <= 0).length;
    const totalOrdered = receiptItems.reduce((acc, row) => acc + Number(row.quantity || 0), 0);
    const totalReceived = receiptItems.reduce((acc, row) => acc + Number(row.received_qty || 0), 0);
    const totalPending = Math.max(0, totalOrdered - totalReceived);
    const rowsToReceive = receiptItems.filter((row) => Number(row.receive_now) > 0);
    const incidences = rowsToReceive.filter((row) => row.incidence_type && row.incidence_type !== "ok");
    const incidenceCounts = incidences.reduce((acc, row) => {
      const key = row.incidence_type as Exclude<IncidenceType, "ok">;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<Exclude<IncidenceType, "ok">, number>);
    return { totalLines, linesWithPending, linesCompleted, totalOrdered, totalReceived, totalPending, rowsToReceive, incidences, incidenceCounts };
  }, [receiptItems]);

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
    const raw = localStorage.getItem("ventuki.purchaseDraftFromReorder");
    if (!raw) return;

    (async () => {
      try {
        const parsed = JSON.parse(raw) as { items?: Array<{ product_id: string; quantity: number; unit_cost?: number; tax_rate?: number }> } | Array<{ product_id: string; quantity: number; unit_cost?: number; tax_rate?: number }>;
        const reorderItems = Array.isArray(parsed) ? parsed : (parsed.items || []);

        if (Array.isArray(reorderItems) && reorderItems.length > 0) {
          setItems(reorderItems.map((item) => ({
            product_id: item.product_id,
            quantity: Number(item.quantity) || 1,
            unit_cost: Number(item.unit_cost) || 0,
            tax_rate: Number(item.tax_rate) || 0,
          })));
          setLoadedFromReorder(true);
          setLoadedReorderCount(reorderItems.length);

          if (company?.id) {
            const suggestion = await suggestSupplierForProducts(company.id, reorderItems.map((item) => item.product_id));
            if (suggestion.supplierId) {
              setSupplierId(suggestion.supplierId);
              setSuggestedSupplierName(suggestion.supplierName);
              toast.info(`Se cargó recompra desde Inventario con proveedor sugerido: ${suggestion.supplierName || "sin nombre"}. Revisa si conviene separar productos para otros proveedores.`);
            } else {
              setSuggestedSupplierName(null);
              toast.info("Se cargó una sugerencia de recompra desde Inventario. Completa proveedor, costos y datos de la orden.");
            }
          }
        }
      } catch {
        // ignore malformed draft
      } finally {
        localStorage.removeItem("ventuki.purchaseDraftFromReorder");
      }
    })();
  }, [company?.id]);

  useEffect(() => {
    if (!selectedPurchaseId) return;
    (async () => {
      const { data, error } = await getPendingPurchaseItems(selectedPurchaseId);
      if (error) {
        toast.error(error.message);
        return;
      }
      setReceiptItems((data || []).map((row: any) => ({ ...row, receive_now: 0, incidence_type: "ok" as IncidenceType, incidence_notes: "", lot_code: "", expiration_date: "" })));
    })();
  }, [selectedPurchaseId]);

  const setItemAt = (index: number, patch: Partial<PurchaseItemDraft>) => {
    setItems((prev) => prev.map((it, idx) => (idx === index ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...itemBase }]);
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, idx) => idx !== index));

  const resetDraftForm = () => {
    setEditingDraftId("");
    setFolio("");
    setExpectedDate("");
    setNotes("");
    setItems([{ ...itemBase }]);
  };

  const onCreatePurchase = async () => {
    if (!company?.id || !branchId || !supplierId || !user?.id) {
      toast.error("Completa empresa, sucursal y proveedor");
      return;
    }

    setSaving(true);
    const payload = {
      companyId: company.id,
      branchId,
      supplierId,
      userId: user.id,
      invoiceNumber: folio,
      expectedDate,
      notes,
      items: items.filter((i) => i.product_id),
    };
    const { data, error } = editingDraftId
      ? await updateDraftPurchase({ ...payload, purchaseId: editingDraftId })
      : await createDraftPurchase(payload);
    setSaving(false);

    if (error || !data) {
      toast.error(error?.message || (editingDraftId ? "No se pudo actualizar la compra" : "No se pudo crear la compra"));
      return;
    }

    toast.success(editingDraftId ? "Draft actualizado" : "Orden de compra creada en draft");
    const nextPurchaseId = editingDraftId || data?.purchase_id;
    resetDraftForm();
    if (nextPurchaseId) {
      setSelectedPurchaseId(nextPurchaseId);
    }
    loadPurchases();
  };

  const onEditDraft = async () => {
    if (!company?.id || !selectedPurchaseId) return;

    const { data, error } = await getPurchaseDraftDetail(selectedPurchaseId, company.id);
    if (error || !data?.purchase) {
      toast.error(error?.message || "No se pudo cargar el draft");
      return;
    }

    setEditingDraftId(data.purchase.id);
    setBranchId(data.purchase.branch_id);
    setSupplierId(data.purchase.supplier_id);
    setFolio(data.purchase.folio || "");
    setExpectedDate(data.purchase.expected_date || "");
    setNotes(data.purchase.notes || "");
    setItems((data.items || []).map((item) => ({
      product_id: item.product_id,
      quantity: Number(item.quantity) || 1,
      unit_cost: Number(item.unit_cost) || 0,
      tax_rate: Number(item.tax_rate || 0) * 100,
    })));
    toast.success("Draft cargado para edición");
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

    const rowsToReceive = receiptItems.filter((row) => Number(row.receive_now) > 0);

    const missingExpirationControl = rowsToReceive.find((row) => {
      const requiresExpiration = Boolean(row.products?.control_expiration);
      if (!requiresExpiration) return false;
      return !String(row.lot_code || "").trim() || !String(row.expiration_date || "").trim();
    });

    if (missingExpirationControl) {
      toast.error("Captura lote y fecha de caducidad para los productos que requieren control de caducidad");
      return;
    }

    const payload = rowsToReceive
      .map((row) => ({ purchase_item_id: row.id as string, quantity_received: Number(row.receive_now) }));

    if (payload.length === 0) {
      toast.error("Captura cantidades a recibir");
      return;
    }

    const incidentLog = rowsToReceive
      .map((row) => ({
        purchase_item_id: row.id,
        incidence_type: row.incidence_type as IncidenceType,
        notes: row.incidence_notes || null,
        expiration_control: row.products?.control_expiration
          ? {
              lot_code: row.lot_code || null,
              expiration_date: row.expiration_date || null,
            }
          : null,
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
      setReceiptItems((updated.data || []).map((row: any) => ({ ...row, receive_now: 0, incidence_type: "ok", incidence_notes: "", lot_code: "", expiration_date: "" })));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compras y Entradas</h1>
          <p className="text-muted-foreground">Fase B: draft → confirmed → recepción parcial/total → cancel/reopen.</p>
        </div>

        {loadedFromReorder && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Recompra cargada desde Inventario</p>
                <p className="text-sm text-muted-foreground">
                  Se cargaron {loadedReorderCount} producto(s) al borrador de compra. Revisa proveedor, costos y cantidades antes de confirmar.
                </p>
              </div>
              {suggestedSupplierName && (
                <p className="text-sm text-muted-foreground">Proveedor sugerido: <span className="font-medium text-foreground">{suggestedSupplierName}</span></p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{editingDraftId ? "Editar draft de compra" : "Nueva orden de compra"}</CardTitle>
              <CardDescription>{editingDraftId ? "Puedes corregir el borrador mientras siga en draft." : "Se crea en draft y se confirma después."}</CardDescription>
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
                  <Select value={supplierId} onValueChange={(value) => { setSupplierId(value); setSuggestedSupplierName(suppliers.find((s) => s.id === value)?.name || null); }}>
                    <SelectTrigger><SelectValue placeholder="Selecciona proveedor" /></SelectTrigger>
                    <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  {suggestedSupplierName && <p className="text-xs text-muted-foreground">Proveedor sugerido para esta recompra: {suggestedSupplierName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Folio / Factura proveedor</Label>
                  <Input value={folio} onChange={(e) => setFolio(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha esperada</Label>
                  <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              {suggestedSupplierName && items.length > 0 && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Agrupación sugerida de recompra</p>
                  <p className="text-muted-foreground">
                    Esta recompra se cargó con proveedor sugerido: {suggestedSupplierName}. Si algunos productos deben comprarse con otro proveedor, sepáralos en otro draft.
                  </p>
                </div>
              )}

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
                <Button onClick={onCreatePurchase} disabled={saving || !canCreate}>{saving ? "Guardando..." : editingDraftId ? "Actualizar draft" : "Crear draft"}</Button>
                {editingDraftId ? <Button variant="secondary" onClick={resetDraftForm}>Cancelar edición</Button> : null}
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
                <Button variant="outline" onClick={onEditDraft} disabled={!selectedPurchaseId || !selectedPurchase || selectedPurchase.status !== "draft"}>Editar draft</Button>
                <Button variant="outline" onClick={onConfirmPurchase} disabled={!selectedPurchaseId || !selectedPurchase || !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "confirmed")}>Confirmar</Button>
                <Button variant="destructive" onClick={onCancelPurchase} disabled={!selectedPurchaseId || !selectedPurchase || !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "cancelled")}>Cancelar</Button>
                <Button variant="secondary" onClick={onReopenPurchase} disabled={!selectedPurchaseId || !selectedPurchase || !canTransitionPurchase(selectedPurchase.status as PurchaseStatus, "draft")}>Reabrir</Button>
              </div>

              {selectedPurchase && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p className="font-medium">Estado actual de la compra</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Estatus</p>
                      <p className="font-medium capitalize">{selectedPurchase.status}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Monto</p>
                      <p className="font-medium">${Number(selectedPurchase.total || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Folio</p>
                      <p className="font-medium">{selectedPurchase.folio || selectedPurchase.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedPurchaseId && receiptItems.length > 0 && (
                <div className="space-y-3 rounded-md border bg-primary/5 p-3 text-sm">
                  <div>
                    <p className="font-medium">Resumen de recepción</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-3">
                      <div>
                        <p className="text-muted-foreground">Partidas completas</p>
                        <p className="font-medium">{receiptSummary.linesCompleted} / {receiptSummary.totalLines}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Recibido acumulado</p>
                        <p className="font-medium">{receiptSummary.totalReceived.toFixed(3)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pendiente acumulado</p>
                        <p className="font-medium">{receiptSummary.totalPending.toFixed(3)}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {receiptSummary.linesWithPending > 0
                        ? "La compra sigue con partidas pendientes; la recepción puede quedar parcial."
                        : "Todas las partidas están completas; la compra debería quedar lista como recibida."}
                    </p>
                  </div>

                  <div className="rounded-md border bg-background/80 p-3">
                    <p className="font-medium">Incidencias preparadas para esta recepción</p>
                    {receiptSummary.rowsToReceive.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">Aún no capturas cantidades para esta recepción.</p>
                    ) : receiptSummary.incidences.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">Las partidas capturadas van sin incidencias.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap gap-2 text-xs">
                          {receiptSummary.incidenceCounts.faltante ? <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">Faltantes: {receiptSummary.incidenceCounts.faltante}</span> : null}
                          {receiptSummary.incidenceCounts.dano ? <span className="rounded-full bg-red-100 px-2 py-1 text-red-800">Daños: {receiptSummary.incidenceCounts.dano}</span> : null}
                          {receiptSummary.incidenceCounts.sobrante ? <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">Sobrantes: {receiptSummary.incidenceCounts.sobrante}</span> : null}
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {receiptSummary.incidences.map((row) => (
                            <div key={row.id} className="rounded border bg-muted/40 px-2 py-1">
                              <span className="font-medium text-foreground">{row.products?.name || row.products?.sku || "Producto"}</span>
                              {": "}
                              <span className="capitalize">{row.incidence_type}</span>
                              {row.incidence_notes ? `, ${row.incidence_notes}` : ""}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead>Recibir ahora</TableHead>
                    <TableHead>Incidencia</TableHead>
                    <TableHead>Caducidad / lote</TableHead>
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
                        <TableCell>
                          {row.products?.control_expiration ? (
                            <div className="space-y-2 min-w-48">
                              <Input
                                placeholder="Lote"
                                value={row.lot_code || ""}
                                onChange={(e) => setReceiptItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, lot_code: e.target.value } : r)))}
                              />
                              <Input
                                type="date"
                                value={row.expiration_date || ""}
                                onChange={(e) => setReceiptItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, expiration_date: e.target.value } : r)))}
                              />
                              <p className="text-xs text-muted-foreground">Obligatorio para productos con control de caducidad.</p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No aplica</span>
                          )}
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
