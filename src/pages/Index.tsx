import { AppLayout } from "@/components/layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useDashboardStats } from "./hooks/useDashboardStats";

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export default function Index() {
  const { stats, chartData, loading, error, reload } = useDashboardStats();

  const cards = [
    { title: "Ventas Hoy", value: moneyFormatter.format(stats.todaySales), icon: DollarSign, color: "text-primary" },
    { title: "Transacciones", value: stats.todayTransactions.toString(), icon: ShoppingCart, color: "text-success" },
    { title: "Productos", value: stats.totalProducts.toString(), icon: Package, color: "text-warning" },
    { title: "Clientes", value: stats.totalCustomers.toString(), icon: Users, color: "text-info" },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Resumen general de operaciones en tiempo real
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No se pudieron cargar los indicadores</AlertTitle>
            <AlertDescription className="mt-2 flex flex-wrap items-center gap-3">
              <span>{error}</span>
              <Button type="button" size="sm" variant="outline" onClick={reload}>
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((stat) => (
            <Card key={stat.title} className="pos-shadow-sm border-t-4 border-t-transparent hover:border-t-primary/50 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={cn("p-2 bg-muted rounded-md", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-[120px] mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 pos-shadow-sm">
            <CardHeader>
              <CardTitle>Ventas del Mes</CardTitle>
              <CardDescription>
                Resumen de ingresos diarios agrupados históricamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {loading ? (
                <Skeleton className="w-full h-[300px]" />
              ) : chartData.length > 0 ? (
                <div className="h-[300px] w-full" role="img" aria-label="Gráfica de ventas diarias del mes">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.2)" />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => moneyFormatter.format(Number(value))}
                      />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                        formatter={(value: number) => [moneyFormatter.format(Number(value)), "Ventas"]}
                      />
                      <Bar
                        dataKey="total"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos de ventas en este mes.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-3 pos-shadow-sm opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
            <CardHeader>
              <CardTitle>Avisos Rápidos</CardTitle>
              <CardDescription>Notificaciones y alertas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-md border p-4 shadow-sm bg-success/5">
                    <DollarSign className="text-success h-6 w-6 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Caja Operativa</p>
                      <p className="text-xs text-muted-foreground">Tu sucursal está lista para operar ventas.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-md border p-4 shadow-sm bg-warning/5">
                    <Package className="text-warning h-6 w-6 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Revisa tu inventario</p>
                      <p className="text-xs text-muted-foreground">{stats.totalProducts} productos activos catalogados.</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
