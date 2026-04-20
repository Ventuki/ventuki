import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { toast } from "sonner";
import { useSaveProduct } from "../hooks/useSaveProduct";
import { useManageProducts } from "../hooks/useManageProducts";
import { useAuth } from "@/features/auth";
import { ProductForm, ProductFormValues, emptyFormValues } from "../components/ProductForm";
import { ProductList } from "../components/ProductList";

export default function ProductsPage() {
  const navigate = useNavigate();
  const {
    search,
    setSearch,
    products,
    categories,
    brands,
    units,
    priceLists,
    warehouses,
    loading,
    refreshProducts,
    deleteProduct,
    getProductDetails,
  } = useManageProducts();
  const { branch } = useAuth();
  const [lastSavedProductName, setLastSavedProductName] = useState("");
  const [lastSavedProductReady, setLastSavedProductReady] = useState(false);

  const defaultWarehouseName = useMemo(
    () => warehouses.find((w) => w.branch_id === branch?.id)?.name || warehouses[0]?.name || "el almacén disponible",
    [warehouses, branch?.id],
  );

  const { save, saving } = useSaveProduct();
  const [initialValues, setInitialValues] = useState<ProductFormValues>(emptyFormValues);

  const handleClear = () => {
    const defaultWarehouseId = warehouses.find(w => w.branch_id === branch?.id)?.id || warehouses[0]?.id || "";
    setInitialValues({
      ...emptyFormValues,
      warehouse_id: defaultWarehouseId,
      manage_stock: false,
      initial_stock: 0,
    });
  };

  const handleEdit = async (id: string) => {
    const details = await getProductDetails(id);
    if (!details) return;

    setInitialValues({
      id: details.product.id,
      sku: details.product.sku,
      name: details.product.name,
      description: details.product.description || "",
      category_id: details.product.category_id || "",
      brand_id: details.product.brand_id || "",
      unit_id: details.product.unit_id || "",
      barcode: details.barcode || "",
      price_list_id: details.price_list_id || "",
      price: details.price,
      cost: details.cost,
      is_active: Boolean(details.product.is_active),
      control_expiration: Boolean((details.product as any).control_expiration),
    });
  };

  const handleDelete = async (id: string) => {
    await deleteProduct(id);
    if (initialValues.id === id) {
      handleClear();
    }
  };

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      await save({
        id: data.id || undefined,
        sku: data.sku.trim(),
        name: data.name.trim(),
        description: data.description || "",
        category_id: data.category_id || undefined,
        brand_id: data.brand_id || undefined,
        unit_id: data.unit_id || undefined,
        barcode: data.barcode?.trim() || undefined,
        price_list_id: data.price_list_id || undefined,
        price: data.price,
        cost: data.cost,
        is_active: data.is_active,
        manage_stock: data.manage_stock,
        control_expiration: data.control_expiration,
        initial_stock: data.initial_stock,
        warehouse_id: data.warehouse_id,
      });

      setLastSavedProductName(data.name.trim());
      setLastSavedProductReady(Boolean(data.is_active) && Number(data.price || 0) > 0);
      toast.success(data.id ? "Producto actualizado" : "Producto creado");
      handleClear();
      refreshProducts();
    } catch (error: any) {
      toast.error(error?.message || "No se pudo guardar producto");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">CatÃ¡logo de productos con SKU, cÃ³digo de barras y precio.</p>
        </div>

        {lastSavedProductName && (
          <Card className="border-success/30 bg-success/5">
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">Producto guardado: {lastSavedProductName}</p>
                <p className="text-sm text-muted-foreground">
                  {lastSavedProductReady
                    ? "Quedó con base mínima para validarlo en POS. Si maneja stock, conviene revisar Inventario también."
                    : "Aún puede faltarle algo para venta en POS, normalmente precio operativo o activación."}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => navigate("/inventory")}>
                  Ver inventario
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/pos")}>
                  Ir al POS
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2 items-start opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
          <ProductForm
            categories={categories}
            brands={brands}
            units={units}
            priceLists={priceLists}
            warehouses={warehouses}
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onClear={handleClear}
            saving={saving}
          />

          <ProductList
            search={search}
            onSearchChange={setSearch}
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </AppLayout>
  );
}

