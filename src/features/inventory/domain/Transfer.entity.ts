export class Transfer {
  constructor(
    public readonly from_warehouse: string,
    public readonly to_warehouse: string,
    public readonly qty: number,
  ) {
    if (!from_warehouse) throw new Error("validar almacén origen");
    if (!to_warehouse) throw new Error("validar almacén destino");
    if (from_warehouse === to_warehouse) throw new Error("almacén inválido");
    if (!Number.isFinite(qty) || qty <= 0) throw new Error("validar cantidad");
  }
}
