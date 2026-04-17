import { getStockUseCase } from "../getStock.usecase";

export const getStockQuery = (input: any) => getStockUseCase(input);
