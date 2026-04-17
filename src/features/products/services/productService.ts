import { supabase } from "@/integrations/supabase/client";

export interface SimpleOption { id: string; name: string }
export interface ProductRow { id: string; sku: string; name: string; is_active: boolean }

export interface ProductPayload {
  company_id: string;
  sku: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  unit_id?: string | null;
  is_active: boolean;
}

export async function loadProductCatalogs(companyId: string) {
  const [cRes, bRes, uRes, pRes, wRes] = await Promise.all([
    supabase.from("categories" as any).select("id,name").eq("company_id", companyId).eq("is_active", true),
    supabase.from("brands" as any).select("id,name").eq("company_id", companyId).eq("is_active", true),
    supabase.from("units" as any).select("id,name").eq("company_id", companyId).eq("is_active", true),
    supabase.from("price_lists" as any).select("id,name").eq("company_id", companyId).eq("is_active", true),
    supabase.from("warehouses" as any).select("id,name,branch_id").eq("company_id", companyId),
  ]);

  return {
    categories: (cRes.data || []) as unknown as SimpleOption[],
    brands: (bRes.data || []) as unknown as SimpleOption[],
    units: (uRes.data || []) as unknown as SimpleOption[],
    priceLists: (pRes.data || []) as unknown as SimpleOption[],
    warehouses: (wRes.data || []) as unknown as Array<{ id: string; name: string; branch_id?: string }>,
  };
}

export async function searchProducts(companyId: string, search: string) {
  const term = search.trim();
  let productIdsFromBarcode: string[] = [];

  if (term) {
    const { data: barcodeMatches } = await supabase
      .from("product_barcodes" as any)
      .select("product_id")
      .eq("company_id", companyId)
      .ilike("barcode", `%${term}%`);
    productIdsFromBarcode = ((barcodeMatches || []) as unknown as Array<{ product_id: string }>).map((b) => b.product_id);
  }

  let query = supabase
    .from("products" as any)
    .select("id,sku,name,is_active")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (term) {
    const sanitized = term.replace(/,/g, "");
    if (productIdsFromBarcode.length > 0) {
      query = query.or(`name.ilike.%${sanitized}%,sku.ilike.%${sanitized}%,id.in.(${productIdsFromBarcode.join(",")})`);
    } else {
      query = query.or(`name.ilike.%${sanitized}%,sku.ilike.%${sanitized}%`);
    }
  }

  const { data, error } = await query;
  return { data: (data || []) as unknown as ProductRow[], error };
}

export async function validateProductUniqueness(companyId: string, sku: string, barcode?: string, currentId?: string) {
  const normalizedSku = sku.trim();
  if (!normalizedSku) return { ok: true as const };

  let skuQuery = supabase
    .from("products" as any)
    .select("id,sku")
    .eq("company_id", companyId)
    .eq("sku", normalizedSku)
    .limit(1);

  if (currentId) skuQuery = skuQuery.neq("id", currentId);

  const { data: skuHit, error: skuError } = await skuQuery.maybeSingle();
  if (skuError) return { ok: false as const, message: skuError.message };
  if (skuHit) return { ok: false as const, message: `SKU duplicado: ${normalizedSku}` };

  const normalizedBarcode = (barcode || "").trim();
  if (normalizedBarcode) {
    let barcodeQuery = supabase
      .from("product_barcodes" as any)
      .select("product_id,barcode")
      .eq("company_id", companyId)
      .eq("barcode", normalizedBarcode)
      .limit(1);

    if (currentId) barcodeQuery = barcodeQuery.neq("product_id", currentId);

    const { data: barcodeHit, error: barcodeError } = await barcodeQuery.maybeSingle();
    if (barcodeError) return { ok: false as const, message: barcodeError.message };
    if (barcodeHit) return { ok: false as const, message: `Barcode duplicado: ${normalizedBarcode}` };
  }

  return { ok: true as const };
}

export async function upsertProduct(productId: string, payload: ProductPayload) {
  if (productId) {
    return await supabase.from("products" as any).update(payload as any).eq("id", productId).select("id").single() as unknown as { data: { id: string }; error: any };
  }

  return await supabase.from("products" as any).insert(payload as any).select("id").single() as unknown as { data: { id: string }; error: any };
}

export async function upsertPrimaryBarcode(companyId: string, productId: string, barcode: string) {
  return await supabase.from("product_barcodes" as any).upsert({
    company_id: companyId,
    product_id: productId,
    barcode,
    is_primary: true,
  } as any);
}

export async function upsertProductPrice(
  companyId: string,
  productId: string,
  priceListId: string,
  price: number,
  cost: number,
) {
  return await supabase.from("product_prices" as any).upsert({
    company_id: companyId,
    product_id: productId,
    price_list_id: priceListId,
    price,
    cost,
  } as any);
}

export async function getProductForEdit(id: string, companyId: string) {
  const [productRes, barcodeRes, priceRes] = await Promise.all([
    supabase
      .from("products" as any)
      .select("id,sku,name,description,category_id,brand_id,unit_id,is_active")
      .eq("id", id)
      .eq("company_id", companyId)
      .single(),
    supabase
      .from("product_barcodes" as any)
      .select("barcode")
      .eq("product_id", id)
      .eq("company_id", companyId)
      .eq("is_primary", true)
      .maybeSingle(),
    supabase
      .from("product_prices" as any)
      .select("price_list_id,price,cost")
      .eq("product_id", id)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const product = productRes.data as unknown as Record<string, any> | null;
  const barcodeData = barcodeRes.data as unknown as Record<string, any> | null;
  const priceData = priceRes.data as unknown as Record<string, any> | null;

  return {
    product,
    productError: productRes.error,
    barcode: barcodeData?.barcode || "",
    price: Number(priceData?.price || 0),
    cost: Number(priceData?.cost || 0),
    price_list_id: priceData?.price_list_id || "",
  };
}

export async function deleteProductById(id: string, companyId: string) {
  return await supabase.from("products" as any).delete().eq("id", id).eq("company_id", companyId);
}
