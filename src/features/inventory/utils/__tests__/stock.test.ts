import { describe, expect, it } from "vitest";
import { buildInventoryFilter, resolveMovementType, validateStockDelta } from "@/features/inventory/utils/stock";

describe("inventory stock utils", () => {
  it("resolveMovementType returns null for zero", () => {
    expect(resolveMovementType(0)).toBeNull();
  });

  it("resolveMovementType maps positive/negative", () => {
    expect(resolveMovementType(5)).toBe("adjustment_in");
    expect(resolveMovementType(-2)).toBe("adjustment_out");
  });

  it("validateStockDelta rejects zero", () => {
    expect(validateStockDelta(0)).toBe("La cantidad no puede ser cero");
  });

  it("buildInventoryFilter includes barcode matches", () => {
    const rows: any = [
      { product_id: "a", products: { name: "Martillo", sku: "MT-01" } },
      { product_id: "b", products: { name: "Taladro", sku: "TL-99" } },
    ];

    const result = buildInventoryFilter(rows, "0001", ["b"]);
    expect(result).toHaveLength(1);
    expect(result[0].product_id).toBe("b");
  });
});
