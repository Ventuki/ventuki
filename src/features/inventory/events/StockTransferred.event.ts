export interface StockTransferredEvent {
  name: "inventory.stock.transferred";
  payload: {
    company_id: string;
    branch_id: string;
    from_warehouse: string;
    to_warehouse: string;
    product_id: string;
    qty: number;
    actor_user_id?: string;
  };
}
