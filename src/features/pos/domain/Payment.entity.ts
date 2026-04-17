import type { PaymentInput } from "../types/payment.types";

export class PaymentEntity {
  constructor(public readonly payments: PaymentInput[]) {}

  totalPaid() {
    return this.payments.reduce((acc, payment) => acc + payment.amount, 0);
  }
}
