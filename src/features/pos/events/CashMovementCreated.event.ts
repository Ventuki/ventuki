export interface CashMovementCreatedEvent {
  name: "CashMovementCreated";
  sale_id: string;
  amount: number;
  happenedAt: string;
}

export const createCashMovementCreatedEvent = (
  sale_id: string,
  amount: number,
): CashMovementCreatedEvent => ({
  name: "CashMovementCreated",
  sale_id,
  amount,
  happenedAt: new Date().toISOString(),
});
