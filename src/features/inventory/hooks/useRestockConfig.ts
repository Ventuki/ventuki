import { useState } from "react";
import { useAuth } from "@/features/auth";
import { getInventoryPermissionsByRole } from "../application/security/rbac.service";
import { updateRestockConfigCommand } from "../application/commands/updateRestockConfig.command";

export function useRestockConfig(onDone?: () => void) {
  const { company, branch, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const run = async (input: { warehouse_id: string; product_id: string; min_qty: number; max_qty: number | null }) => {
    if (!company?.id || !branch?.id) throw new Error("Contexto de tenant incompleto");
    setLoading(true);
    try {
      const response = await updateRestockConfigCommand({
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
