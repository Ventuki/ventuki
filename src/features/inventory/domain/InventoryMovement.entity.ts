import type { InventoryMovementType } from "../types/inventory.types";

export class InventoryMovement {
  constructor(
    public readonly type: InventoryMovementType,
    public readonly qty: number,
    public readonly product_id: string,
    public readonly warehouse_id: string,
    public readonly reference?: string,
  ) {
    if (!product_id) throw new Error("producto requerido");
    if (!warehouse_id) throw new Error("validar almacén");
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("validar cantidad");
  }
}
