import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { getInventoryPermissionsByRole } from "../application/security/rbac.service";
import { getStockQuery } from "../application/queries/getStock.query";
import type { StockRecord } from "../types/inventory.types";

export function useInventory(search: string, warehouse_id: string) {
  const { company, branch, user } = useAuth();
  const [rows, setRows] = useState<StockRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!company?.id || !branch?.id) return;
    setLoading(true);
    setError(null);
    try {
      const permissions = getInventoryPermissionsByRole(company.role);
      const data = await getStockQuery({
        company_id: company.id,
        branch_id: branch.id,
        warehouse_id,
        search,
        permissions,
        actor_user_id: user?.id,
      });
      setRows(data);
    } catch (e: any) {
      setError(e.message || "Error cargando inventario");
    } finally {
      setLoading(false);
    }
  }, [company?.id, company?.role, branch?.id, user?.id, search, warehouse_id]);

  useEffect(() => {
    run();
  }, [run]);

  return { rows, loading, error, refresh: run };
}
