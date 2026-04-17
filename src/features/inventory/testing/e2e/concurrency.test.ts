import { describe, expect, it } from "vitest";
import { Stock } from "../../domain/Stock.entity";

describe("Inventory concurrency", () => {
  it("simula ajustes concurrentes sin stock negativo", async () => {
    const stock = new Stock(50, 0, 5, null);

    await Promise.all([
      Promise.resolve().then(() => stock.adjust(-10)),
      Promise.resolve().then(() => stock.adjust(-15)),
      Promise.resolve().then(() => stock.adjust(20)),
    ]);

    expect(stock.qty).toBe(45);
  });
});
