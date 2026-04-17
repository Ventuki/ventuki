import { supabase } from "@/integrations/supabase/client";
import type { InvoiceItemRecord } from "../types/invoice.types";

export const invoiceItemRepository = {
  async createMany(invoiceId: string, items: InvoiceItemRecord[]) {
    return await supabase.from("invoice_items" as any).insert(
      items.map((item) => ({
        invoice_id: invoiceId,
        product_id: item.product_id,
        description: item.description,
        qty: item.qty,
        price: item.price,
        tax: item.taxes.reduce((acc, t) => acc + t.amount, 0),
        total: item.total,
      })) as any,
    );
  },
};
