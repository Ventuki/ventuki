import type { CartSnapshot } from "../types/cart.types";
import type { SaleTotals } from "../types/sale.types";

export function TicketPreview({ cart, totals }: { cart: CartSnapshot; totals: SaleTotals }) {
  return (
    <article className="rounded border p-3 text-xs">
      <h4 className="mb-2 font-semibold">Ticket previo</h4>
      {cart.lines.map((line) => (
        <p key={line.id}>
          {line.product_name} x{line.quantity}
        </p>
      ))}
      <p className="mt-2 font-medium">Total: {totals.grand_total.toFixed(2)}</p>
    </article>
  );
}
