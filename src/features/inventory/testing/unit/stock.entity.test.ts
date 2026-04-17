import { describe, expect, it } from "vitest";
import { Stock } from "../../domain/Stock.entity";

describe("Stock entity", () => {
  it("aplica ajuste positivo/negativo respetando no negativo", () => {
    const stock = new Stock(10, 0, 2, null);
    stock.adjust(-4);
    expect(stock.qty).toBe(6);
    expect(() => stock.adjust(-10)).toThrowError(/stock negativo/i);
  });

  it("reserva y libera stock", () => {
    const stock = new Stock(20, 0, 1, 100);
    stock.reserve(5);
    expect(stock.reserved_qty).toBe(5);
    stock.release(3);
    expect(stock.reserved_qty).toBe(2);
  });
});
