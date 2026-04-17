import type { SaleRecord } from "../types/sale.types";

export interface SaleCompletedEvent {
  name: "SaleCompleted";
  sale: SaleRecord;
  happenedAt: string;
}

export const createSaleCompletedEvent = (sale: SaleRecord): SaleCompletedEvent => ({
  name: "SaleCompleted",
  sale,
  happenedAt: new Date().toISOString(),
});
