import type { CreateSaleCommand } from "../../types/sale.types";
import { createSaleUseCase } from "../createSale.usecase";

export const createSaleCommand = (input: CreateSaleCommand, permissions: Array<"pos.create" | "pos.discount" | "pos.cancel">) =>
  createSaleUseCase(input, permissions);
