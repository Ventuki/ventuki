import { useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { reportRepository } from "../infrastructure/report.repository";

export default function ReportsPage() {
  const { company } = useAuth();
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    total_amount: number;
    estimated_profit: number;
    items_sold: number;
    sale_count: number;
  } | null>(null);

  const generateReport = async () => {
    if (!company?.id) {
      toast.error("Empresa no seleccionada");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await reportRepository.getDailySales(
        company.id,
        new Date(startDate),
        new Date(endDate),
      );
      if (error || !data) {
        toast.error("Error al generar reporte");
        return;
      }
      setReport(data);
    } catch {
      toast.error("Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

  const sanitizeCSVCall = (value: string | number) => {
    const str = String(value);
    if (/^[=+\-@]/.test(str)) return `"'${str}"`;
    return `"${str}"`;
  };

  const exportCSV = () => {
    if (!report) return;
    const header = "Ventas Totales,Ganancia Estimada,Productos Vendidos,Numero de Ventas\n";
    const row = [
      sanitizeCSVCall(report.total_amount),
      sanitizeCSVCall(report.estimated_profit),
      sanitizeCSVCall(report.items_sold),
      sanitizeCSVCall(report.sale_count)
    ].join(",");
    
    const blob = new Blob([header + row], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_ventas_${startDate}_${endDate}.csv`;
    a.click();
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Ventas diarias y analitica basica.</p>
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Ventas por rango de fechas</CardTitle>
            <CardDescription>Selecciona un rango para generar el reporte.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-4">
              <Button onClick={generateReport} disabled={loading}>
                {loading ? "Generando..." : "Generar reporte"}
              </Button>
              {report && (
                <Button variant="outline" onClick={exportCSV}>Exportar CSV Seguro</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {report && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Ventas totales</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{fmt(report.total_amount)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Ganancia estimada</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold text-green-600">{fmt(report.estimated_profit)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Productos vendidos</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{report.items_sold}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Numero de ventas</CardDescription></CardHeader>
              <CardContent><p className="text-2xl font-bold">{report.sale_count}</p></CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
