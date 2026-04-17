import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Filter, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { layawayFiltersSchema, type LayawayFiltersFormValues } from "../schemas/layaway.schema";
import type { LayawayFilters } from "../types";

interface LayawayFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: LayawayFilters) => void;
}

export function LayawayFiltersSheet({ open, onOpenChange, onApply }: LayawayFiltersSheetProps) {
  const form = useForm<LayawayFiltersFormValues>({
    resolver: zodResolver(layawayFiltersSchema),
    defaultValues: {
      status: undefined,
      customer_id: undefined,
      from_date: "",
      to_date: "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onApply({
      status: values.status,
      customer_id: values.customer_id || undefined,
      from_date: values.from_date || undefined,
      to_date: values.to_date || undefined,
    });
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar Apartados
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label>Estatus</Label>
            <Select
              value={form.watch("status") ?? "all"}
              onValueChange={(v) =>
                form.setValue("status", v === "all" ? undefined : (v as any))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Desde fecha</Label>
            <Input type="date" {...form.register("from_date")} />
          </div>

          <div className="space-y-2">
            <Label>Hasta fecha</Label>
            <Input type="date" {...form.register("to_date")} />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Button type="submit" className="w-full">
              Aplicar Filtros
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                form.reset();
                onApply({});
                onOpenChange(false);
              }}
            >
              Limpiar Todo
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}