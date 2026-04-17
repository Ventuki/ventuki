import type { AdjustInput } from "../../validations/adjust.schema";
import { adjustStockUseCase } from "../adjustStock.usecase";

export const adjustStockCommand = (input: AdjustInput) => adjustStockUseCase(input);
