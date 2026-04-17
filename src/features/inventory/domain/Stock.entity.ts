import { inventoryConfig } from "../config/inventory.config";

export class Stock {
  constructor(
    public qty: number,
    public reserved_qty: number,
    public readonly min_qty: number,
    public readonly max_qty: number | null,
  ) {}

  get availableQty() {
    return this.qty - this.reserved_qty;
  }

  adjust(delta: number) {
    const next = this.qty + delta;
    if (!inventoryConfig.allowNegativeStock && next < 0) {
      throw new Error("stock negativo");
    }
    this.qty = next;
  }

  reserve(amount: number) {
    if (amount <= 0) throw new Error("validar cantidad");
    if (this.availableQty < amount) throw new Error("stock insuficiente para reserva");
    this.reserved_qty += amount;
  }

  release(amount: number) {
    if (amount <= 0) throw new Error("validar cantidad");
    if (this.reserved_qty < amount) throw new Error("reserva inválida");
    this.reserved_qty -= amount;
  }
}
