import { z } from "zod";
import { ensureProductPermission } from "./security/rbac.service";
import { productRepository } from "../infrastructure/product.repository";
import { productAuditRepository } from "../infrastructure/audit.repository";

const deleteProductSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  actor_user_id: z.string().uuid().optional(),
  permissions: z.array(z.enum(["product.create", "product.update", "product.delete"])),
});

export type DeleteProductInput = z.infer<typeof deleteProductSchema>;

export async function deleteProductUseCase(command: DeleteProductInput) {
  const input = deleteProductSchema.parse(command) as any;
  ensureProductPermission(input.permissions, "product.delete");

  const deleted = await productRepository.deleteProduct(input.id, input.company_id);
  if (deleted.error) throw deleted.error;

  await productAuditRepository.record({
    company_id: input.company_id,
    actor_user_id: input.actor_user_id,
    action: "product.deleted",
    entity_id: input.id,
    new_data: {},
  });

  return { ok: true };
}
