export type CFDIUse =
  | "G01"
  | "G02"
  | "G03"
  | "I01"
  | "I02"
  | "I03"
  | "I04"
  | "I05"
  | "I06"
  | "I07"
  | "I08"
  | "D01"
  | "D02"
  | "D03"
  | "D04"
  | "D05"
  | "D06"
  | "D07"
  | "D08"
  | "D09"
  | "D10"
  | "S01"
  | "CP01"
  | "CN01";

export type PaymentMethod = "PUE" | "PPD";
export type PaymentForm = "01" | "02" | "03" | "04" | "28" | "99";

export interface FiscalAddress {
  postalCode: string;
  fiscalRegime: string;
}
