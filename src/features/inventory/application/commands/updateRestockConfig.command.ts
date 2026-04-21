import { updateRestockConfigUseCase } from "../updateRestockConfig.usecase";
import type { RestockConfigInput } from "../../validations/restock.schema";

export const updateRestockConfigCommand = (input: RestockConfigInput) => updateRestockConfigUseCase(input);
