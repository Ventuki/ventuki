import { supabase } from "@/integrations/supabase/client";

async function count(table: string, companyId: string, productId: string) {
  const { count, error } = await supabase
    .from(table as any)
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("product_id", productId);

  if (error) throw error;
  return Number(count || 0);
}

export const productRepository = {
  async upsertProduct(productId: string | undefined, payload: {
    company_id: string;
    sku: string;
    name: string;
    description?: string | null;
    category_id?: string | null;
    brand_id?: string | null;
    unit_id?: string | null;
    is_active: boolean;
    control_expiration?: boolean;
  }) {
    if (productId) {
      return await supabase
        .from("products" as any)
        .update(payload as any)
        .eq("id", productId)
        .eq("company_id", payload.company_id)
        .select("id")
        .single() as unknown as { data: { id: string } | null; error: any };
    }

    return await supabase
      .from("products" as any)
      .insert(payload as any)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: any };
  },

  async upsertPrimaryBarcode(companyId: string, productId: string, barcode: string) {
    return await supabase.from("product_barcodes" as any).upsert({
      company_id: companyId,
      product_id: productId,
      barcode,
      is_primary: true,
    } as any);
  },

  async upsertPrice(companyId: string, productId: string, priceListId: string, price: number, cost: number) {
    return await supabase.from("product_prices" as any).upsert({
      company_id: companyId,
      product_id: productId,
      price_list_id: priceListId,
      price,
      cost,
    } as any);
  },

  async hasOperationalReferences(id: string, companyId: string) {
    const [prices, barcodes, purchaseItems, saleItems, stockLevels, stockMovements, physicalCountItems] = await Promise.all([
      count("product_prices", companyId, id),
      count("product_barcodes", companyId, id),
      count("purchase_items", companyId, id),
      count("sale_items", companyId, id),
      count("stock_levels", companyId, id),
      count("stock_movements", companyId, id),
      count("physical_count_items", companyId, id),
    ]);

    return {
      hasReferences: [prices, barcodes, purchaseItems, saleItems, stockLevels, stockMovements, physicalCountItems].some((value) => value > 0),
      detail: {
        product_prices: prices,
        product_barcodes: barcodes,
        purchase_items: purchaseItems,
        sale_items: saleItems,
        stock_levels: stockLevels,
        stock_movements: stockMovements,
        physical_count_items: physicalCountItems,
      },
    };
  },

  async deactivateProduct(id: string, companyId: string) {
    return await supabase
      .from("products" as any)
      .update({ is_active: false } as any)
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id")
      .single() as unknown as { data: { id: string } | null; error: any };
  },

  async deleteProduct(id: string, companyId: string) {
    return await supabase.from("products" as any).delete().eq("id", id).eq("company_id", companyId);
  },
};
