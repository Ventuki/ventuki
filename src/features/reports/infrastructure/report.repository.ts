import { supabase } from "@/integrations/supabase/client";

export const reportRepository = {
  async getDailySales(companyId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase.rpc("get_daily_sales_report" as any, {
      _company_id: companyId,
      _start_date: startDate.toISOString(),
      _end_date: endDate.toISOString(),
    } as any);

    if (error) return { data: null, error };

    return { 
      data: data as { 
        total_amount: number; 
        estimated_profit: number; 
        items_sold: number; 
        date_range: [string, string];
      }, 
      error: null 
    };
  }
};
