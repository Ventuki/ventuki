import { useCallback, useEffect, useState } from "react";
import { startOfDay, startOfMonth, addDays, format } from "date-fns";
import { es } from "date-fns/locale";
import { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/features/auth";

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  totalCustomers: number;
}

export interface SalesChartData {
  date: string;
  total: number;
}

const EMPTY_STATS: DashboardStats = {
  todaySales: 0,
  todayTransactions: 0,
  totalProducts: 0,
  totalCustomers: 0,
};

function isMissingTableError(error: PostgrestError | null): boolean {
  return error?.code === "42P01";
}

function sanitizeAmount(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

export function useDashboardStats() {
  const { company, branch } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [chartData, setChartData] = useState<SalesChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!company?.id || !branch?.id) {
      setStats(EMPTY_STATS);
      setChartData([]);
      setError("Selecciona una compañía y sucursal para ver el dashboard.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const todayStart = startOfDay(new Date());
    const tomorrowStart = addDays(todayStart, 1);
    const monthStart = startOfMonth(new Date());

    try {
      const salesTodayQuery = supabase
        .from("sales")
        .select("total", { count: "exact" })
        .eq("company_id", company.id)
        .eq("branch_id", branch.id)
        .eq("status", "completed")
        .gte("created_at", todayStart.toISOString())
        .lt("created_at", tomorrowStart.toISOString());

      const productsQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("is_active", true);

      const customersQuery = supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("company_id", company.id)
        .eq("is_active", true);

      const monthSalesQuery = supabase
        .from("sales")
        .select("total, created_at")
        .eq("company_id", company.id)
        .eq("branch_id", branch.id)
        .eq("status", "completed")
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", tomorrowStart.toISOString());

      const [salesTodayRes, productsRes, customersRes, monthSalesRes] = await Promise.all([
        salesTodayQuery,
        productsQuery,
        customersQuery,
        monthSalesQuery,
      ]);

      if (salesTodayRes.error) throw salesTodayRes.error;
      if (productsRes.error) throw productsRes.error;
      if (monthSalesRes.error) throw monthSalesRes.error;

      if (customersRes.error && !isMissingTableError(customersRes.error)) {
        throw customersRes.error;
      }

      const todaySales = (salesTodayRes.data ?? []).reduce(
        (acc, sale) => acc + sanitizeAmount(sale.total),
        0,
      );
      const todayTransactions = Number(salesTodayRes.count ?? 0);
      const totalProducts = Number(productsRes.count ?? 0);
      const totalCustomers = isMissingTableError(customersRes.error)
        ? 0
        : Number(customersRes.count ?? 0);

      const groupedByDate: Record<string, number> = {};
      for (const sale of monthSalesRes.data ?? []) {
        const day = sale.created_at?.split("T")[0];
        if (!day) continue;
        groupedByDate[day] = (groupedByDate[day] ?? 0) + sanitizeAmount(sale.total);
      }

      const chartArray = Object.entries(groupedByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, total]) => ({
          date: format(new Date(`${date}T00:00:00`), "dd/MMM", { locale: es }),
          total,
        }));

      setStats({
        todaySales,
        todayTransactions,
        totalProducts,
        totalCustomers,
      });
      setChartData(chartArray);
    } catch (err) {
      console.error("Error loading dashboard stats:", err);
      setStats(EMPTY_STATS);
      setChartData([]);
      setError("No se pudo cargar el dashboard. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }, [company?.id, branch?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return { stats, chartData, loading, error, reload: loadStats };
}
