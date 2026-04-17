import type { FiscalDataRecord } from "../types/invoice.types";
import { rfcSchema } from "../validations/rfc.schema";

export class FiscalDataEntity {
  constructor(public readonly data: FiscalDataRecord) {}

  validate() {
    rfcSchema.parse(this.data.rfc);
    if (!this.data.cfdiUse) throw new Error("Uso CFDI requerido");
    if (!this.data.fiscalRegime) throw new Error("Régimen fiscal requerido");
    if (!/^\d{5}$/.test(this.data.postalCode)) throw new Error("Código postal inválido");
    return true;
  }
}
