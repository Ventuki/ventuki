import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SimpleOption } from "@/features/products/services/productService";

const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "SKU es obligatorio"),
  name: z.string().min(1, "Nombre es obligatorio"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  brand_id: z.string().optional(),
  unit_id: z.string().optional(),
  price_list_id: z.string().optional(),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo"),
  is_active: z.boolean().default(true),
  manage_stock: z.boolean().default(false),
  initial_stock: z.coerce.number().min(0, "El stock inicial no puede ser negativo").optional(),
  warehouse_id: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const emptyFormValues: ProductFormValues = {
  sku: "",
  name: "",
  description: "",
  barcode: "",
  category_id: "",
  brand_id: "",
  unit_id: "",
  price_list_id: "",
  price: 0,
  cost: 0,
  is_active: true,
  manage_stock: false,
  initial_stock: 0,
  warehouse_id: "",
};

interface ProductFormProps {
  categories: SimpleOption[];
  brands: SimpleOption[];
  units: SimpleOption[];
  priceLists: SimpleOption[];
  warehouses: SimpleOption[];
  initialValues: ProductFormValues;
  onSubmit: (data: ProductFormValues) => void;
  onClear: () => void;
  saving: boolean;
}

export function ProductForm({
  categories,
  brands,
  units,
  priceLists,
  warehouses,
  initialValues,
  onSubmit,
  onClear,
  saving,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  });

  // Keep form in sync when edit changes the initialValues
  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  // Pre-seleccionar la primera lista de precios si no hay una y es un nuevo producto
  useEffect(() => {
    const currentPriceList = watch("price_list_id");
    if (!currentPriceList && priceLists.length > 0 && !initialValues.id) {
      setValue("price_list_id", priceLists[0].id);
    }
  }, [priceLists, watch, setValue, initialValues.id]);

  return (
    <Card className="pos-shadow-sm h-fit">
      <CardHeader>
        <CardTitle>{initialValues.id ? "Editar producto" : "Nuevo producto"}</CardTitle>
        <CardDescription>CRUD base de productos con datos comerciales.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input {...register("sku")} placeholder="Ej. PROD-01" />
              {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...register("name")} placeholder="Nombre del producto" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Input {...register("description")} placeholder="Descripción breve opcional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={watch("category_id") || "none"} onValueChange={(v) => setValue("category_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={watch("brand_id") || "none"} onValueChange={(v) => setValue("brand_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin marca</SelectItem>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={watch("unit_id") || "none"} onValueChange={(v) => setValue("unit_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin unidad</SelectItem>
                  {units.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Barcode principal</Label>
              <Input {...register("barcode")} placeholder="Código de barras" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Lista de precio</Label>
              <Select value={watch("price_list_id") || "none"} onValueChange={(v) => setValue("price_list_id", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna</SelectItem>
                  {priceLists.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Costo</Label>
              <Input type="number" step="0.01" {...register("cost")} onFocus={(e) => e.target.select()} />
              {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Precio</Label>
              <Input type="number" step="0.01" {...register("price")} onFocus={(e) => e.target.select()} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label>Estatus Operativo</Label>
              <Select value={watch("is_active") ? "true" : "false"} onValueChange={(v) => setValue("is_active", v === "true")}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!initialValues.id && (
              <>
                <div className="flex items-center space-x-2 py-1 border-t mt-1 pt-3">
                  <Checkbox 
                    id="manage_stock" 
                    checked={watch("manage_stock")} 
                    onCheckedChange={(checked) => setValue("manage_stock", !!checked)} 
                  />
                  <Label htmlFor="manage_stock" className="cursor-pointer">Gestionar Inventario (Cargar stock inicial)</Label>
                </div>

                {watch("manage_stock") && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label>Almacén *</Label>
                      <Select 
                        value={watch("warehouse_id")} 
                        onValueChange={(v) => setValue("warehouse_id", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Seleccionar almacén" /></SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {errors.warehouse_id && <p className="text-xs text-destructive">Requerido si gestiona stock</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>Stock Inicial *</Label>
                      <Input type="number" step="1" {...register("initial_stock")} onFocus={(e) => e.target.select()} />
                      {errors.initial_stock && <p className="text-xs text-destructive">{errors.initial_stock.message}</p>}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : initialValues.id ? "Actualizar" : "Crear Producto"}
            </Button>
            <Button type="button" variant="outline" onClick={onClear} disabled={saving}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
