import { supabase } from "@/integrations/supabase/client";
import type { TenantContext } from "../types/sale.types";

export interface ProductDetail {
  id: string;
  name: string;
  sku: string;
  price: number;
  tax_rate: number;
  max_discount_percent: number;
}

export const productRepository = {
  async getProducts(ctx: TenantContext, query: string) {
    return await supabase
      .from("products" as any)
      .select("id,name,sku")
      .eq("company_id", ctx.company_id)
      .eq("is_active", true)
      .or(`name.ilike.%${query.trim()}%,sku.ilike.%${query.trim()}%`)
      .limit(30);
  },

  async searchPOSProducts(ctx: TenantContext, query: string) {
    return await supabase.rpc("get_pos_products_search", {
      _company_id: ctx.company_id,
      _branch_id: ctx.branch_id,
      _warehouse_id: ctx.warehouse_id,
      _search_term: query.trim(),
    });
  },

  /** Carga todos los datos de un producto necesarios para el carrito POS */
  async getProductDetail(ctx: TenantContext, productId: string): Promise<ProductDetail | null> {
    // Carga producto + precio de lista + perfil de impuesto en paralelo
    const [productRes, priceRes, taxRes] = await Promise.all([
      supabase
        .from("products" as any)
        .select("id,name,sku")
        .eq("company_id", ctx.company_id)
        .eq("id", productId)
        .maybeSingle(),

      supabase
        .from("product_prices" as any)
        .select("price,cost")
        .eq("company_id", ctx.company_id)
        .eq("product_id", productId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),

      // Obtiene el perfil fiscal activo de la empresa (IVA, IEPS, etc.)
      supabase
        .from("tax_profiles" as any)
        .select("tax_rate")
        .eq("company_id", ctx.company_id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    const product = productRes.data as any;
    const priceRow = priceRes.data as any;
    const taxRow = taxRes.data as any;

    if (!product) return null;

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(priceRow?.price ?? 0),
      tax_rate: Number(taxRow?.tax_rate ?? 0.16),        // default IVA México
      max_discount_percent: 30,                           // TODO: mover a product config
    };
  },

  /** @deprecated usar getProductDetail — mantiene compat hacia atrás */
  async getPrice(ctx: TenantContext, productId: string) {
    return await supabase
      .from("product_prices" as any)
      .select("price")
      .eq("company_id", ctx.company_id)
      .eq("product_id", productId)
      .limit(1)
      .maybeSingle();
  },
};
