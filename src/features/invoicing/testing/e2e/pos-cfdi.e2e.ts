import { test, expect } from "vitest";
import { invoicingFlows } from "../../ux/invoicingFlows";

test("E2E POS completo -> CFDI", () => {
  expect(invoicingFlows.fromPOS).toEqual([
    "Venta pagada",
    "Botón Facturar",
    "Captura RFC",
    "Uso CFDI",
    "Método pago",
    "Timbrar",
    "Descargar PDF/XML",
  ]);
});
