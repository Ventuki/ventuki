export type TaxType = "traslado" | "retencion";

export interface TaxLine {
  code: string;
  type: TaxType;
  rate: number;
  base: number;
  amount: number;
}

export interface TaxSummary {
  subtotal: number;
  taxes: TaxLine[];
  totalTaxes: number;
  total: number;
}
