import type { ProductUpsertInput } from "../../validations/product.schema";
import { upsertProductUseCase } from "../upsertProduct.usecase";

export const upsertProductCommand = (input: ProductUpsertInput) => upsertProductUseCase(input);
