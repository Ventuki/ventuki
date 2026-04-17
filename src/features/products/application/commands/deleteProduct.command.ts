import type { DeleteProductInput } from "../deleteProduct.usecase";
import { deleteProductUseCase } from "../deleteProduct.usecase";

export const deleteProductCommand = (input: DeleteProductInput) => deleteProductUseCase(input);
