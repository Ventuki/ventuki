import { describe, expect, it } from "vitest";
import { Transfer } from "../../domain/Transfer.entity";

describe("Transfer rules", () => {
  it("valida almacenes y cantidad", () => {
    expect(() => new Transfer("a", "a", 1)).toThrowError(/almacén inválido/i);
    expect(() => new Transfer("a", "b", 0)).toThrowError(/validar cantidad/i);
    const transfer = new Transfer("a", "b", 2);
    expect(transfer.qty).toBe(2);
  });
});
