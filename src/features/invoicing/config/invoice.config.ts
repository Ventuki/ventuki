export interface InvoiceConfig {
  satProvider: "finkok" | "sw" | "test";
  defaultCurrency: string;
  defaultTaxRate: number;
  retryStamp: {
    attempts: number;
    delayMs: number;
  };
  branchSeries: Record<string, string>;
}

export const invoiceConfig: InvoiceConfig = {
  satProvider: "finkok",
  defaultCurrency: "MXN",
  defaultTaxRate: 0.16,
  retryStamp: {
    attempts: 3,
    delayMs: 350,
  },
  branchSeries: {},
};

export function getSeriesByBranch(branchId: string) {
  return invoiceConfig.branchSeries[branchId] ?? "A";
}
