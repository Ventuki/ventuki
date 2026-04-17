import { POSLayout } from "./POSLayout";
import { ProductSearch } from "./ProductSearch";
import { CartView } from "./CartView";
import { TotalsView } from "./TotalsView";
import { TicketPreview } from "./TicketPreview";
import type { CartSnapshot } from "../types/cart.types";
import type { SaleTotals } from "../types/sale.types";

export function POSScreen(props: {
  search: string;
  onSearchChange: (value: string) => void;
  cart: CartSnapshot;
  totals: SaleTotals;
}) {
  const left = (
    <div className="space-y-4">
      <ProductSearch value={props.search} onChange={props.onSearchChange} />
      <CartView lines={props.cart.lines} />
    </div>
  );

  const right = (
    <div className="space-y-4">
      <TotalsView totals={props.totals} />
      <TicketPreview cart={props.cart} totals={props.totals} />
    </div>
  );

  return <POSLayout left={left} right={right} />;
}
