import type { CartLine } from "../types/cart.types";

export function CartView({ lines }: { lines: CartLine[] }) {
  return (
    <div className="space-y-2">
      {lines.map((line) => (
        <div className="rounded border p-2" key={line.id}>
          <p className="font-medium">{line.product_name}</p>
          <p className="text-sm text-muted-foreground">
            {line.quantity} x {line.unit_price.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}
