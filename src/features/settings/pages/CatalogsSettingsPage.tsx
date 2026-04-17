import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CatalogConfig {
  key: string;
  table: string;
  label: string;
  supportsDefault?: boolean;
  supportsTaxRate?: boolean;
  supportsSortOrder?: boolean;
}

interface CatalogItem {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default?: boolean;
  tax_rate?: number;
  sort_order?: number;
}

const catalogConfigs: CatalogConfig[] = [
  { key: "categories", table: "categories", label: "Categorías" },
  { key: "brands", table: "brands", label: "Marcas" },
  { key: "units", table: "units", label: "Unidades" },
  { key: "payment_methods", table: "payment_methods", label: "Métodos de pago" },
  { key: "price_lists", table: "price_lists", label: "Listas de precio", supportsDefault: true },
  { key: "tax_profiles", table: "tax_profiles", label: "Perfiles fiscales", supportsTaxRate: true },
  { key: "customer_types", table: "customer_types", label: "Tipos de cliente", supportsSortOrder: true },
  { key: "supplier_types", table: "supplier_types", label: "Tipos de proveedor", supportsSortOrder: true },
];

const emptyForm = {
  id: "",
  code: "",
  name: "",
  description: "",
  is_active: true,
  is_default: false,
  tax_rate: "0",
  sort_order: "0",
};

export default function CatalogsSettingsPage() {
  const { company } = useAuth();
  const [activeKey, setActiveKey] = useState(catalogConfigs[0].key);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeConfig = useMemo(
    () => catalogConfigs.find((c) => c.key === activeKey) || catalogConfigs[0],
    [activeKey],
  );

  const resetForm = () => setForm(emptyForm);

  const loadItems = async () => {
    if (!company?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from(activeConfig.table as any)
      .select("*")
      .eq("company_id", company.id)
      .order("name", { ascending: true });

    setLoading(false);

    if (error) {
      toast.error(`No se pudo cargar ${activeConfig.label.toLowerCase()}`);
      return;
    }

    setItems((data || []) as unknown as CatalogItem[]);
  };

  useEffect(() => {
    loadItems();
    resetForm();
  }, [activeKey, company?.id]);

  const saveItem = async () => {
    if (!company?.id) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    const payload: any = {
      company_id: company.id,
      code: form.code || null,
      name: form.name.trim(),
      description: form.description || null,
      is_active: form.is_active,
    };

    if (activeConfig.supportsDefault) payload.is_default = form.is_default;
    if (activeConfig.supportsTaxRate) payload.tax_rate = Number(form.tax_rate || 0);
    if (activeConfig.supportsSortOrder) payload.sort_order = Number(form.sort_order || 0);

    setSaving(true);
    const query = form.id
      ? supabase.from(activeConfig.table as any).update(payload).eq("id", form.id)
      : supabase.from(activeConfig.table as any).insert(payload);

    const { error } = await query;
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(form.id ? "Registro actualizado" : "Registro creado");
    resetForm();
    loadItems();
  };

  const editItem = (item: CatalogItem) => {
    setForm({
      id: item.id,
      code: item.code || "",
      name: item.name,
      description: item.description || "",
      is_active: item.is_active,
      is_default: Boolean(item.is_default),
      tax_rate: String(item.tax_rate ?? 0),
      sort_order: String(item.sort_order ?? 0),
    });
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from(activeConfig.table as any).delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Registro eliminado");
    if (form.id === id) resetForm();
    loadItems();
  };

  const importCsv = async (file: File) => {
    if (!company?.id) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) {
      toast.error("CSV sin datos");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).map((line) => line.split(","));

    const payload = rows
      .map((cols) => {
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => (row[h] = (cols[idx] || "").trim()));

        const base: any = {
          company_id: company.id,
          code: row.code || null,
          name: row.name,
          description: row.description || null,
          is_active: row.is_active ? row.is_active === "true" : true,
        };

        if (activeConfig.supportsDefault) base.is_default = row.is_default === "true";
        if (activeConfig.supportsTaxRate) base.tax_rate = Number(row.tax_rate || 0);
        if (activeConfig.supportsSortOrder) base.sort_order = Number(row.sort_order || 0);

        return base;
      })
      .filter((r) => r.name);

    if (!payload.length) {
      toast.error("No hay filas válidas (se requiere columna name)");
      return;
    }

    const { error } = await supabase.from(activeConfig.table as any).insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Importación completada: ${payload.length} registros`);
    loadItems();
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración · Catálogos Maestros</h1>
          <p className="text-muted-foreground">
            Fase 2: administra categorías, marcas, unidades, listas de precio y catálogos de operación.
          </p>
        </div>

        <Tabs value={activeKey} onValueChange={setActiveKey}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {catalogConfigs.map((config) => (
              <TabsTrigger key={config.key} value={config.key} className="rounded-md border px-3 py-2">
                {config.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{form.id ? `Editar ${activeConfig.label.slice(0, -1)}` : `Nuevo en ${activeConfig.label}`}</CardTitle>
              <CardDescription>CRUD base del catálogo seleccionado.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
              </div>

              {activeConfig.supportsTaxRate && (
                <div className="space-y-2">
                  <Label>Tasa de impuesto (%)</Label>
                  <Input type="number" step="0.01" value={form.tax_rate} onChange={(e) => setForm((v) => ({ ...v, tax_rate: e.target.value }))} />
                </div>
              )}

              {activeConfig.supportsSortOrder && (
                <div className="space-y-2">
                  <Label>Orden</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm((v) => ({ ...v, sort_order: e.target.value }))} />
                </div>
              )}

              {activeConfig.supportsDefault && (
                <div className="flex items-center justify-between rounded-md border p-3">
                  <Label>Lista por defecto</Label>
                  <Switch checked={form.is_default} onCheckedChange={(checked) => setForm((v) => ({ ...v, is_default: checked }))} />
                </div>
              )}

              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Activo</Label>
                <Switch checked={form.is_active} onCheckedChange={(checked) => setForm((v) => ({ ...v, is_active: checked }))} />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveItem} disabled={saving}>{saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}</Button>
                <Button variant="outline" onClick={resetForm}>Limpiar</Button>
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <Label htmlFor="csv-import">Importación CSV básica</Label>
                <Input
                  id="csv-import"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importCsv(file);
                    e.currentTarget.value = "";
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Encabezados sugeridos: code,name,description,is_active{activeConfig.supportsTaxRate ? ",tax_rate" : ""}
                  {activeConfig.supportsDefault ? ",is_default" : ""}
                  {activeConfig.supportsSortOrder ? ",sort_order" : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listado de {activeConfig.label}</CardTitle>
              <CardDescription>{loading ? "Cargando..." : `${items.length} registros`}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Estatus</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.code || "—"}</TableCell>
                      <TableCell>{item.is_active ? "Activo" : "Inactivo"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => editItem(item)}>Editar</Button>
                          <Button size="sm" variant="destructive" onClick={() => removeItem(item.id)}>Eliminar</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No hay registros en este catálogo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
