import type { CartSnapshot, RemoveProductCommand } from "../types/cart.types";

export function removeProductUseCase(snapshot: CartSnapshot, command: RemoveProductCommand): CartSnapshot {
  return { ...snapshot, lines: snapshot.lines.filter((line) => line.id !== command.line_id) };
}
