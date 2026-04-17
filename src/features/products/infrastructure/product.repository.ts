import { supabase } from "@/integrations/supabase/client";

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

  async deleteProduct(id: string, companyId: string) {
    return await supabase.from("products" as any).delete().eq("id", id).eq("company_id", companyId);
  },
};
