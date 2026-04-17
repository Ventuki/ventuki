import { useState } from "react";
import { createSaleCommand } from "../application/commands/createSale.command";
import type { CreateSaleCommand } from "../types/sale.types";

export function useCreateSale(permissions: Array<"pos.create" | "pos.discount" | "pos.cancel">) {
  const [loading, setLoading] = useState(false);

  const create = async (input: CreateSaleCommand) => {
    setLoading(true);
    try {
      return await createSaleCommand(input, permissions);
    } finally {
      setLoading(false);
    }
  };

  return { create, loading };
}
