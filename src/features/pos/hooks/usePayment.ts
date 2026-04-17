import { useState } from "react";
import { processPaymentUseCase } from "../application/processPayment.usecase";
import type { CartSnapshot } from "../types/cart.types";
import type { ProcessPaymentCommand } from "../types/payment.types";

export function usePayment() {
  const [loading, setLoading] = useState(false);

  const processPayment = async (cart: CartSnapshot, command: ProcessPaymentCommand) => {
    setLoading(true);
    try {
      return await processPaymentUseCase(cart, command);
    } finally {
      setLoading(false);
    }
  };

  return { processPayment, loading };
}
