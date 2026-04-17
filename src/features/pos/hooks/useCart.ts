import { useMemo, useState } from "react";
import type { CartSnapshot } from "../types/cart.types";
import { CartEntity } from "../domain/Cart.entity";

export function useCart(initial: CartSnapshot) {
  const [cart, setCart] = useState<CartSnapshot>(initial);
  const totals = useMemo(() => new CartEntity(cart).totals(), [cart]);

  return { cart, setCart, totals };
}
