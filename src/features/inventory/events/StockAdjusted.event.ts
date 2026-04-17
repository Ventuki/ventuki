export interface StockAdjustedEvent {
  name: "inventory.stock.adjusted";
  payload: {
    company_id: string;
    branch_id: string;
    warehouse_id: string;
    product_id: string;
    delta: number;
    actor_user_id?: string;
    notes?: string;
  };
}
