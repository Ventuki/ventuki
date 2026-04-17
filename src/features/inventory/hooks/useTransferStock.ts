import { useState } from "react";
import { useAuth } from "@/features/auth";
import { transferStockCommand } from "../application/commands/transferStock.command";
import { getInventoryPermissionsByRole } from "../application/security/rbac.service";

export function useTransferStock(onDone?: () => void) {
  const { company, branch, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const run = async (input: { from_warehouse: string; to_warehouse: string; product_id: string; qty: number; notes?: string }) => {
    if (!company?.id || !branch?.id) throw new Error("Contexto de tenant incompleto");
    setLoading(true);
    try {
      const response = await transferStockCommand({
        ...input,
        company_id: company.id,
        branch_id: branch.id,
        actor_user_id: user?.id,
        permissions: getInventoryPermissionsByRole(company.role),
      });
      onDone?.();
      return response;
    } finally {
      setLoading(false);
    }
  };

  return { run, loading };
}
