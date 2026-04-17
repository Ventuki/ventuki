import { describe, expect, it } from "vitest";
import { nextSaleFlowState } from "../../ux/saleFlow";

describe("POS sale flow", () => {
  it("avanza de carrito a pago y completado", () => {
    const fromCart = nextSaleFlowState("cart_ready", "OPEN_PAYMENT");
    const completed = nextSaleFlowState(fromCart, "COMPLETE");

    expect(fromCart).toBe("paying");
    expect(completed).toBe("completed");
  });
});
