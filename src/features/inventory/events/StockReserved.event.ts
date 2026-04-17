export interface StockReservedEvent {
  name: "inventory.stock.reserved";
  payload: {
    company_id: string;
    branch_id: string;
    warehouse_id: string;
    product_id: string;
    qty: number;
    actor_user_id?: string;
  };
}
