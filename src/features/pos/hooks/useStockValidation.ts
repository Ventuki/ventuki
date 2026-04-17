import { useMemo } from "react";
import type { CartSnapshot } from "../types/cart.types";

export function useStockValidation(cart: CartSnapshot) {
  return useMemo(() => {
    const violations = cart.lines.filter((line) => line.quantity > line.stock_available);
    return {
      valid: violations.length === 0,
      violations,
    };
  }, [cart]);
}
