import type { CreateCreditNoteCommand } from "../types/invoice.types";

export class CreditNoteEntity {
  constructor(private readonly command: CreateCreditNoteCommand) {}

  validate(invoiceTotal: number, invoiceStatus: string) {
    if (invoiceStatus !== "stamped") {
      throw new Error("Solo se puede aplicar nota de crédito a factura timbrada");
    }
    if (this.command.amount <= 0 || this.command.amount > invoiceTotal) {
      throw new Error("Monto de nota de crédito inválido");
    }
    return true;
  }
}
