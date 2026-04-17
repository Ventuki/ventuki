import { supplierRepository } from "../infrastructure/supplier.repository";
import { supplierFormSchema, type SupplierFormInput } from "../validations/supplier.schema";

export type SupplierPermission = "supplier.view" | "supplier.create" | "supplier.edit";

function ensurePermission(permissions: SupplierPermission[], required: SupplierPermission) {
  if (!permissions.includes(required)) throw new Error(`Permiso denegado: ${required}`);
}

export async function createSupplierUseCase(command: SupplierFormInput, permissions: SupplierPermission[]) {
  ensurePermission(permissions, "supplier.create");
  const input = supplierFormSchema.parse(command) as any;

  const result = await supplierRepository.create(input);
  if (result.error || !result.data) {
    throw result.error || new Error("Error al crear proveedor");
  }

  return result.data;
}

export async function updateSupplierUseCase(
  id: string,
  companyId: string,
  command: Partial<SupplierFormInput>,
  permissions: SupplierPermission[]
) {
  ensurePermission(permissions, "supplier.edit");
  const result = await supplierRepository.update(id, companyId, command);
  
  if (result.error || !result.data) {
    throw result.error || new Error("Error al modificar proveedor");
  }

  return result.data;
}
