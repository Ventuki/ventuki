import { reserveStockUseCase } from "../reserveStock.usecase";

export const reserveStockCommand = (input: any) => reserveStockUseCase(input);
