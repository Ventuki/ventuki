export interface ProductCreatedEvent {
  name: "ProductCreated";
  happenedAt: string;
  payload: {
    product_id: string;
    company_id: string;
    sku: string;
    name: string;
    actor_user_id?: string;
  };
}

export const createProductCreatedEvent = (payload: ProductCreatedEvent["payload"]): ProductCreatedEvent => ({
  name: "ProductCreated",
  happenedAt: new Date().toISOString(),
  payload,
});
