import { useState } from "react";
import { useAuth } from "@/features/auth";
import { adjustStockCommand } from "../application/commands/adjustStock.command";
import { getInventoryPermissionsByRole } from "../application/security/rbac.service";

export function useAdjustStock(onDone?: () => void) {
  const { company, branch, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const run = async (input: { warehouse_id: string; product_id: string; delta: number; notes?: string }) => {
    if (!company?.id || !branch?.id) throw new Error("Contexto de tenant incompleto");
    setLoading(true);
    try {
      await adjustStockCommand({
        ...input,
        company_id: company.id,
        branch_id: branch.id,
        actor_user_id: user?.id,
        permissions: getInventoryPermissionsByRole(company.role),
      });
      onDone?.();
      return { ok: true };
    } finally {
      setLoading(false);
    }
  };

  return { run, loading };
}
