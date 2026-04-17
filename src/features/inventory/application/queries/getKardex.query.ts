import { getKardexUseCase } from "../getKardex.usecase";

export const getKardexQuery = (input: any) => getKardexUseCase(input);
