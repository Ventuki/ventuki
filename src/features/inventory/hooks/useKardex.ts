import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { getKardexQuery } from "../application/queries/getKardex.query";
import { getInventoryPermissionsByRole } from "../application/security/rbac.service";
import type { MovementRecord } from "../types/movement.types";

export function useKardex(warehouse_id?: string) {
  const { company } = useAuth();
  const [rows, setRows] = useState<MovementRecord[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!company?.id) return;
      const data = await getKardexQuery({
        company_id: company.id,
        warehouse_id,
        permissions: getInventoryPermissionsByRole(company.role),
      });
      setRows(data);
    };

    run();
  }, [company?.id, company?.role, warehouse_id]);

  return { rows };
}
