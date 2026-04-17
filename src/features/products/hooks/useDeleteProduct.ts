import { useState } from "react";
import { useAuth } from "@/features/auth";
import { getProductPermissionsByRole } from "../application/security/rbac.service";
import { deleteProductCommand } from "../application/commands/deleteProduct.command";

export function useDeleteProduct() {
  const { company, user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const remove = async (id: string) => {
    if (!company?.id) throw new Error("Empresa no seleccionada");

    setDeleting(true);
    try {
      return await deleteProductCommand({
        id,
        company_id: company.id,
        actor_user_id: user?.id,
        permissions: getProductPermissionsByRole(company.role),
      });
    } finally {
      setDeleting(false);
    }
  };

  return { remove, deleting };
}
