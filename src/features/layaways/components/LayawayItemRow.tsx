import type { LayawayItem } from "../types";
import { formatCurrency } from "../utils";

interface LayawayItemRowProps {
  item: LayawayItem;
  readonly?: boolean;
}

export function LayawayItemRow({ item, readonly = false }: LayawayItemRowProps) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-3 py-3">
        <span className="font-medium">{item.product?.name ?? "—"}</span>
        {item.product?.sku && (
          <span className="ml-2 text-xs text-muted-foreground">SKU: {item.product.sku}</span>
        )}
      </td>
      <td className="px-3 py-3 text-center">{item.quantity}</td>
      <td className="px-3 py-3 text-right">{formatCurrency(item.unit_price)}</td>
      <td className="px-3 py-3 text-right font-medium">
        {formatCurrency(item.quantity * item.unit_price)}
      </td>
    </tr>
  );
}