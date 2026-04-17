export interface POSConfig {
  defaultTaxRate: number;
  currency: string;
  decimals: number;
  keyboardShortcuts: Record<string, string>;
  maxGlobalDiscountPercent: number;
}

export const posConfig: POSConfig = {
  defaultTaxRate: 0.16,
  currency: "MXN",
  decimals: 2,
  keyboardShortcuts: {
    search: "Ctrl+K",
    pay: "F9",
    cancel: "Esc",
    complete: "Ctrl+Enter",
  },
  maxGlobalDiscountPercent: 25,
};
