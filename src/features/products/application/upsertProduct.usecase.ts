import { productUpsertSchema, type ProductUpsertInput } from "../validations/product.schema";
import { ensureProductPermission } from "./security/rbac.service";
import { productRepository } from "../infrastructure/product.repository";
import { productAuditRepository } from "../infrastructure/audit.repository";
import { createProductCreatedEvent } from "../events/ProductCreated.event";
import { inventoryRepository } from "../../inventory/infrastructure/inventory.repository";
import { productsCacheLayer } from "../../pos/cache/products.cache";
import { supabase } from "@/integrations/supabase/client";

export async function upsertProductUseCase(command: ProductUpsertInput) {
  const input = productUpsertSchema.parse(command) as any;

  if (input.id) {
    ensureProductPermission(input.permissions, "product.update");
  } else {
    ensureProductPermission(input.permissions, "product.create");
  }

  const saved = await productRepository.upsertProduct(input.id, {
    company_id: input.company_id,
    sku: input.sku,
    name: input.name,
    description: input.description || null,
    category_id: input.category_id || null,
    brand_id: input.brand_id || null,
    unit_id: input.unit_id || null,
    is_active: input.is_active,
  });

  if (saved.error || !saved.data?.id) {
    throw saved.error || new Error("No se pudo guardar producto");
  }

  if (input.barcode?.trim()) {
    const barcodeRes = await productRepository.upsertPrimaryBarcode(input.company_id, saved.data.id, input.barcode.trim());
    if (barcodeRes.error) throw barcodeRes.error;
  }

  let priceListId = input.price_list_id;
  
  if (!priceListId) {
    // Intentar obtener la primera lista de precios de la empresa como fallback
    const { data: priceLists } = await supabase
      .from("price_lists" as any)
      .select("id")
      .eq("company_id", input.company_id)
      .limit(1);
      
    if (priceLists && priceLists.length > 0) {
      priceListId = (priceLists[0] as any).id;
    }
  }

  if (priceListId) {
    const priceRes = await productRepository.upsertPrice(
      input.company_id,
      saved.data.id,
      priceListId,
      input.price,
      input.cost,
    );
    if (priceRes.error) throw priceRes.error;
  }
  
  if (input.manage_stock && input.initial_stock > 0 && input.warehouse_id && !input.id) {
    const stockRes = await inventoryRepository.adjustStock({
      company_id: input.company_id,
      warehouse_id: input.warehouse_id,
      product_id: saved.data.id,
      delta: input.initial_stock,
      movement_type: "initial",
      notes: "Stock inicial en creación de producto",
    });
    if (stockRes.error) throw stockRes.error;
  }

  // Invalidate POS cache for this company/branch context
  // Here we clear all since we don't have the full context if it's multiple branches
  productsCacheLayer.clearTenant(input.company_id);

  await productAuditRepository.record({
    company_id: input.company_id,
    actor_user_id: input.actor_user_id,
    action: input.id ? "product.updated" : "product.created",
    entity_id: saved.data.id,
    new_data: {
      sku: input.sku,
      name: input.name,
      category_id: input.category_id || null,
      brand_id: input.brand_id || null,
      unit_id: input.unit_id || null,
      price_list_id: input.price_list_id || null,
      price: input.price,
      cost: input.cost,
      is_active: input.is_active,
    },
  });

  if (!input.id && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("product:event", {
        detail: createProductCreatedEvent({
          product_id: saved.data.id,
          company_id: input.company_id,
          sku: input.sku,
          name: input.name,
          actor_user_id: input.actor_user_id,
        }),
      }),
    );
  }

  return { id: saved.data.id };
}
