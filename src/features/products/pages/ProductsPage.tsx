import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { toast } from "sonner";
import { useSaveProduct } from "../hooks/useSaveProduct";
import { useManageProducts } from "../hooks/useManageProducts";
import { useAuth } from "@/features/auth";
import { ProductForm, ProductFormValues, emptyFormValues } from "../components/ProductForm";
import { ProductList } from "../components/ProductList";

export default function ProductsPage() {
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

  const { save, saving } = useSaveProduct();
  const [initialValues, setInitialValues] = useState<ProductFormValues>(emptyFormValues);

  const handleClear = () => {
    const defaultWarehouseId = warehouses.find(w => w.branch_id === branch?.id)?.id || warehouses[0]?.id || "";
    setInitialValues({
      ...emptyFormValues,
      warehouse_id: defaultWarehouseId
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
        initial_stock: data.initial_stock,
        warehouse_id: data.warehouse_id,
      });

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

