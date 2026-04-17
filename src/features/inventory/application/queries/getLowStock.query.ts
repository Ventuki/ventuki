import { getStockUseCase } from "../getStock.usecase";

export async function getLowStockQuery(input: any) {
  const rows = await getStockUseCase(input);
  return rows.filter((r: any) => r.qty <= r.min_qty);
}
