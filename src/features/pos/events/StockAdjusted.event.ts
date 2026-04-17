export interface StockAdjustedEvent {
  name: "StockAdjusted";
  sale_id: string;
  movements: Array<{ product_id: string; quantity: number }>;
  happenedAt: string;
}

export const createStockAdjustedEvent = (
  sale_id: string,
  movements: Array<{ product_id: string; quantity: number }>,
): StockAdjustedEvent => ({
  name: "StockAdjusted",
  sale_id,
  movements,
  happenedAt: new Date().toISOString(),
});
