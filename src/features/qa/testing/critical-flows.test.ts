import { describe, expect, it } from "vitest";
import { criticalFlows } from "../flows/criticalFlows";

describe("Critical flows coverage (Fase C)", () => {
  it("all modules have at least 3 critical checkpoints", () => {
    Object.values(criticalFlows).forEach((steps) => {
      expect(steps.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("POS includes multi-method checkout and printable receipt", () => {
    expect(criticalFlows.pos).toContain("Cobro multi-método");
    expect(criticalFlows.pos).toContain("Comprobante imprimible");
  });

  it("Purchases includes full lifecycle checkpoints", () => {
    expect(criticalFlows.purchases).toEqual(
      expect.arrayContaining(["Crear draft", "Confirmar compra", "Recepción parcial", "Recepción total"]),
    );
  });
});
