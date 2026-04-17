import { customerRepository } from "../infrastructure/customer.repository";
import { customerSchema, type CustomerInput } from "../validations/customer.schema";

export type CustomerPermission = "customer.view" | "customer.create" | "customer.edit";

function ensurePermission(permissions: CustomerPermission[], required: CustomerPermission) {
  if (!permissions.includes(required)) throw new Error(`Permiso denegado: ${required}`);
}

export async function createCustomerUseCase(command: CustomerInput, permissions: CustomerPermission[]) {
  ensurePermission(permissions, "customer.create");
  const input = customerSchema.parse(command) as any; // Validación estricta, incluyendo RFC

  const result = await customerRepository.create(input);
  if (result.error || !result.data) {
    throw result.error || new Error("Error al crear cliente");
  }

  return result.data;
}

export async function updateCustomerUseCase(
  id: string,
  companyId: string,
  command: Partial<CustomerInput>,
  permissions: CustomerPermission[]
) {
  ensurePermission(permissions, "customer.edit");
  const result = await customerRepository.update(id, companyId, command);
  
  if (result.error || !result.data) {
    throw result.error || new Error("Error al modificar cliente");
  }

  return result.data;
}
