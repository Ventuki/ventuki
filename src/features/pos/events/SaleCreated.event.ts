import type { SaleRecord } from "../types/sale.types";

export interface SaleCreatedEvent {
  name: "SaleCreated";
  sale: SaleRecord;
  happenedAt: string;
}

export const createSaleCreatedEvent = (sale: SaleRecord): SaleCreatedEvent => ({
  name: "SaleCreated",
  sale,
  happenedAt: new Date().toISOString(),
});
