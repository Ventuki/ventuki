import { useMemo, useState } from "react";
import type { CartSnapshot } from "../types/cart.types";
import type { TenantContext } from "../types/sale.types";
import { useCart } from "./useCart";
import { useProductSearch } from "./useProductSearch";
import { useStockValidation } from "./useStockValidation";

export function usePOS(ctx: TenantContext, initialCart: CartSnapshot) {
  const [search, setSearch] = useState("");
  const { cart, setCart, totals } = useCart(initialCart);
  const products = useProductSearch(ctx, search);
  const stock = useStockValidation(cart);

  const canCheckout = useMemo(() => cart.lines.length > 0 && stock.valid, [cart.lines.length, stock.valid]);

  return {
    cart,
    setCart,
    totals,
    search,
    setSearch,
    products,
    stock,
    canCheckout,
  };
}
