import { useState } from "react";
import { useAuth } from "@/features/auth";
import { upsertProductCommand } from "../application/commands/upsertProduct.command";
import { getProductPermissionsByRole } from "../application/security/rbac.service";

interface SaveProductInput {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  barcode?: string;
  category_id?: string;
  brand_id?: string;
  unit_id?: string;
  price_list_id?: string;
  price: number;
  cost: number;
  is_active: boolean;
  manage_stock?: boolean;
  initial_stock?: number;
  warehouse_id?: string;
}

export function useSaveProduct() {
  const { company, user } = useAuth();
  const [saving, setSaving] = useState(false);

  const save = async (input: SaveProductInput) => {
    if (!company?.id) throw new Error("Empresa no seleccionada");

    setSaving(true);
    try {
      return await upsertProductCommand({
        ...input,
        company_id: company.id,
        actor_user_id: user?.id,
        description: input.description || null,
        category_id: input.category_id || null,
        brand_id: input.brand_id || null,
        unit_id: input.unit_id || null,
        permissions: getProductPermissionsByRole(company.role),
      });
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}
