import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, getRemainingAmount, customerDisplayName } from "../utils";
import { STATUS_COLORS, STATUS_LABELS } from "../utils";
import type { Layaway } from "../types";
import { useLayaways } from "../hooks/useLayaways";
import { CreateLayawayDialog } from "./CreateLayawayDialog";
import { LayawayFiltersSheet } from "./LayawayFiltersSheet";

export function LayawayList() {
  const [filters, setFilters] = useState<Parameters<typeof useLayaways>[0]>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const { data: layaways = [], isLoading } = useLayaways(filters);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Apartados</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            Filtros
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Apartado
          </button>
        </div>
      </div>

      {/* Active filters summary */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm">
          <span className="text-muted-foreground">Filtros activos:</span>
          {filters.status && (
            <span className="rounded bg-background px-2 py-0.5 text-xs">
              {STATUS_LABELS[filters.status]}
            </span>
          )}
          {filters.customer_id && (
            <span className="rounded bg-background px-2 py-0.5 text-xs">Cliente específico</span>
          )}
          {(filters.from_date || filters.to_date) && (
            <span className="rounded bg-background px-2 py-0.5 text-xs">
              {filters.from_date ?? "..."} → {filters.to_date ?? "..."}
            </span>
          )}
          <button
            onClick={() => setFilters({})}
            className="ml-auto text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpiar
          </button>
        </div>
      )}

      <div className="rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Folio</th>
              <th className="px-4 py-3 text-left font-medium">Cliente</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Pagado</th>
              <th className="px-4 py-3 text-right font-medium">Resto</th>
              <th className="px-4 py-3 text-center font-medium">Estatus</th>
              <th className="px-4 py-3 text-left font-medium">Fecha</th>
              <th className="px-4 py-3 text-center font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : layaways.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No hay apartados{" "}
                  {Object.keys(filters).length > 0 ? "con los filtros seleccionados" : "registrados"}
                </td>
              </tr>
            ) : (
              layaways.map((row: Layaway) => {
                const remaining = getRemainingAmount(row);
                return (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      #{row.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">{customerDisplayName(row.customer)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.total_amount)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(row.paid_amount)}</td>
                    <td className={cn("px-4 py-3 text-right font-medium", remaining > 0 ? "text-orange-600" : "text-green-600")}>
                      {formatCurrency(remaining)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[row.status])}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(row.created_at).toLocaleDateString("es-MX")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/layaways/${row.id}`}
                        className="inline-flex items-center gap-1 rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateLayawayDialog open={showCreate} onOpenChange={setShowCreate} />
      <LayawayFiltersSheet open={showFilters} onOpenChange={setShowFilters} onApply={setFilters} />
    </div>
  );
}