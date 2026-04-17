import { useEffect, useState } from "react";
import { getProductsQuery } from "../application/queries/getProducts.query";
import type { TenantContext } from "../types/sale.types";

export function useProductSearch(ctx: TenantContext, term: string) {
  const [rows, setRows] = useState<Array<{ id: string; name: string; sku: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const result = await getProductsQuery(ctx, term);
      if (active) setRows(result);
      setLoading(false);
    };

    if (term.length >= 1) run();
    return () => {
      active = false;
    };
  }, [ctx, term]);

  return { rows, loading };
}
