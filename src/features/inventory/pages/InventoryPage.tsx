import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { useInventory } from "../hooks/useInventory";
import { useStock } from "../hooks/useStock";
import { useAdjustStock } from "../hooks/useAdjustStock";
import { useTransferStock } from "../hooks/useTransferStock";
import { useKardex } from "../hooks/useKardex";
import { useStockAlerts } from "../hooks/useStockAlerts";
import { InventoryTable } from "../ui/InventoryTable";
import { KardexTable } from "../ui/KardexTable";
import { AdjustInventoryModal } from "../ui/AdjustInventoryModal";
import { TransferStockPanel } from "../ui/TransferStockPanel";
import { StockAlertsPanel } from "../ui/StockAlertsPanel";
import { PhysicalCountPanel } from "../ui/PhysicalCountPanel";
import { loadInventoryMeta } from "../services/inventoryService";

export default function InventoryPage() {
  const { company, branch, user } = useAuth();
  const [search, setSearch] = useState("");
  const [warehouseId, setWarehouseId] = useState("all");
  const [warehouseOptions, setWarehouseOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [productOptions, setProductOptions] = useState<Array<{ id: string; name: string }>>([]);

  const { rows, error } = useInventory(search, warehouseId);
  const { rows: kardex } = useKardex(warehouseId === "all" ? undefined : warehouseId);
  const summary = useStock(rows);
  const alerts = useStockAlerts(rows);

  const adjustStock = useAdjustStock(() => toast.success("Ajuste aplicado"));
  const transferStock = useTransferStock(() => toast.success("Transferencia aplicada"));

  useEffect(() => {
    const run = async () => {
      if (!company?.id) return;
      const { warehouses, products, error: metaError } = await loadInventoryMeta(company.id);
      if (metaError) {
        toast.error(metaError.message);
        return;
      }

      setWarehouseOptions(warehouses);
      setProductOptions(products.map((p) => ({ id: p.id, name: `${p.name}${p.sku ? ` (${p.sku})` : ""}` })));
    };

    run();
  }, [company?.id]);

  const mergedWarehouseOptions = useMemo(
    () =>
      Array.from(
        new Map(
          [...warehouseOptions, ...rows.map((r) => ({ id: r.warehouse_id, name: r.warehouse_name || r.warehouse_id }))].map((w) => [w.id, w]),
        ).values(),
      ),
    [warehouseOptions, rows],
  );

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario multi-sucursal + CEDIS</h1>
          <p className="text-muted-foreground">Ajustes, transferencias internas, kardex, alertas y conteo físico.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros de inventario</CardTitle>
            <CardDescription>Stock por sucursal y por almacén.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <Label>Buscar</Label>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Producto o SKU" />
            </div>
            <div className="space-y-1">
              <Label>Almacén</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {mergedWarehouseOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-3">
              <AdjustInventoryModal
                warehouseOptions={mergedWarehouseOptions}
                productOptions={productOptions}
                onSubmit={async (input) => {
                  await adjustStock.run(input);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Stock por sucursal/almacén</CardTitle>
              <CardDescription>{summary.totalRows} registros · {summary.totalQty.toFixed(3)} piezas totales</CardDescription>
            </CardHeader>
            <CardContent>
              <InventoryTable rows={rows} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alertas inventario</CardTitle>
              <CardDescription>Min/Max automático</CardDescription>
            </CardHeader>
            <CardContent>
              <StockAlertsPanel alerts={alerts} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TransferStockPanel
            warehouseOptions={mergedWarehouseOptions}
            productOptions={productOptions}
            onTransfer={async (input) => {
              if (input.from_warehouse === input.to_warehouse) {
                toast.error("Origen y destino no pueden ser iguales");
                return;
              }
              await transferStock.run(input);
            }}
          />
          <PhysicalCountPanel
            companyId={company?.id}
            branchId={branch?.id}
            userId={user?.id}
            warehouseOptions={mergedWarehouseOptions}
            productOptions={productOptions}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kardex de movimientos</CardTitle>
            <CardDescription>{kardex.length} movimientos recientes</CardDescription>
          </CardHeader>
          <CardContent>
            <KardexTable rows={kardex} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
