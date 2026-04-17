import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import {
  deleteProductById,
  getProductForEdit,
  loadProductCatalogs,
  ProductRow,
  searchProducts,
  SimpleOption,
} from "@/features/products/services/productService";

export interface WarehouseOption extends SimpleOption {
  branch_id?: string;
}

export function useManageProducts() {
  const { company } = useAuth();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<SimpleOption[]>([]);
  const [brands, setBrands] = useState<SimpleOption[]>([]);
  const [units, setUnits] = useState<SimpleOption[]>([]);
  const [priceLists, setPriceLists] = useState<SimpleOption[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCatalogs = useCallback(async () => {
    if (!company?.id) return;
    try {
      const data = await loadProductCatalogs(company.id);
      setCategories(data.categories);
      setBrands(data.brands);
      setUnits(data.units);
      setPriceLists(data.priceLists);
      setWarehouses(data.warehouses);
    } catch (error) {
      console.error("Error loading catalogs:", error);
    }
  }, [company?.id]);

  const loadProducts = useCallback(async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const { data, error } = await searchProducts(company.id, search);
      if (error) {
        toast.error(error.message);
        return;
      }
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, [company?.id, search]);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const deleteProduct = async (id: string) => {
    const { error } = await deleteProductById(id, company?.id || "");
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Producto eliminado");
    loadProducts();
    return true;
  };

  const getProductDetails = async (id: string) => {
    if (!company?.id) return null;
    const result = await getProductForEdit(id, company.id);
    if (result.productError || !result.product) {
      toast.error(result.productError?.message || "No se pudo cargar el producto");
      return null;
    }
    return result;
  };

  return {
    search,
    setSearch,
    products,
    categories,
    brands,
    units,
    priceLists,
    warehouses,
    loading,
    refreshProducts: loadProducts,
    deleteProduct,
    getProductDetails,
  };
}

