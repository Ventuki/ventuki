import type { CancelSaleCommand } from "../../types/sale.types";
import { cancelSaleUseCase } from "../cancelSale.usecase";

export const cancelSaleCommand = (input: CancelSaleCommand, permissions: Array<"pos.create" | "pos.discount" | "pos.cancel">) =>
  cancelSaleUseCase(input, permissions);
