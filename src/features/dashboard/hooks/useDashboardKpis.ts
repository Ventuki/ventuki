import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth";
import { getDashboardKpis, type DashboardKpis } from "../services/dashboardService";

const emptyKpis: DashboardKpis = {
  salesToday: 0,
  transactionsToday: 0,
  activeProducts: 0,
  activeCustomers: 0,
};

export function useDashboardKpis() {
  const { company, branch } = useAuth();
  const [kpis, setKpis] = useState<DashboardKpis>(emptyKpis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!company?.id || !branch?.id) {
        setKpis(emptyKpis);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardKpis(company.id, branch.id);
        setKpis(data);
      } catch (e: any) {
        setError(e?.message || "No se pudo cargar dashboard");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [company?.id, branch?.id]);

  return { kpis, loading, error };
}
