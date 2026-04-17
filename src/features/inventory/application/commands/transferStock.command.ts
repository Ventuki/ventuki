import type { TransferInput } from "../../validations/transfer.schema";
import { transferStockUseCase } from "../transferStock.usecase";

export const transferStockCommand = (input: TransferInput) => transferStockUseCase(input);
