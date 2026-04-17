import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, Ban } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLayawayDetail, useCancelLayaway } from "../hooks/useLayaways";
import { useAddLayawayPayment } from "../hooks/useLayawayPayments";
import { addPaymentSchema, type AddPaymentFormValues } from "../schemas/layaway.schema";
import {
  formatCurrency,
  getRemainingAmount,
  getProgressPercent,
  customerDisplayName,
  STATUS_COLORS,
  STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "../utils";
import { LayawayItemRow } from "./LayawayItemRow";
import { LayawayPaymentRow } from "./LayawayPaymentRow";

export function LayawayDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: layaway, isLoading } = useLayawayDetail(id ?? null);
  const cancelLayaway = useCancelLayaway();
  const addPayment = useAddLayawayPayment();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const paymentForm = useForm<AddPaymentFormValues>({
    resolver: zodResolver(addPaymentSchema),
    defaultValues: { amount: 0, payment_method: "cash" },
  });

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Cargando apartado...</div>;
  }

  if (!layaway) {
    return <div className="p-6 text-center text-muted-foreground">Apartado no encontrado</div>;
  }

  const remaining = getRemainingAmount(layaway);
  const progress = getProgressPercent(layaway);
  const customerName = customerDisplayName(layaway.customer);

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm("¿Cancelar este apartado? Los productos quedarán disponibles.")) return;
    try {
      await cancelLayaway.mutateAsync(id);
    } catch {
      // handled in hook
    }
  };

  const handleAddPayment = paymentForm.handleSubmit(async (values) => {
    if (!id) return;
    try {
      await addPayment.mutateAsync({
        layaway_id: id,
        amount: values.amount,
        payment_method: values.payment_method,
        payment_details: values.payment_details as Record<string, unknown>,
      });
      setShowPaymentDialog(false);
      paymentForm.reset();
    } catch {
      // handled in hook
    }
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/layaways"
          className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Apartados
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Apartado #{id?.slice(0, 8).toUpperCase()}</h1>
          <p className="text-sm text-muted-foreground">
            Cliente: {customerName} — Creado el{" "}
            {new Date(layaway.created_at).toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Info + Items */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resumen</CardTitle>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[layaway.status]}`}
                >
                  {STATUS_LABELS[layaway.status]}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(layaway.total_amount)}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(layaway.paid_amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">Pagado</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {formatCurrency(remaining)}
                  </p>
                  <p className="text-xs text-muted-foreground">Resto</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progreso de pago</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {layaway.due_date && (
                <p className="text-sm text-muted-foreground">
                  Fecha esperada de entrega:{" "}
                  <span className="font-medium">
                    {new Date(layaway.due_date).toLocaleDateString("es-MX")}
                  </span>
                </p>
              )}
              {layaway.notes && (
                <p className="text-sm text-muted-foreground">Notas: {layaway.notes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos ({layaway.items?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {layaway.items && layaway.items.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Producto</th>
                      <th className="px-3 py-2 text-center font-medium">Cantidad</th>
                      <th className="px-3 py-2 text-right font-medium">P. Unit.</th>
                      <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layaway.items.map((item) => (
                      <LayawayItemRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-center text-muted-foreground">Sin productos</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Payments + Actions */}
        <div className="space-y-6">
          {/* Actions */}
          {layaway.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <Banknote className="h-4 w-4" />
                  Agregar Abono
                </Button>
                <Button
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:bg-destructive/10"
                  onClick={handleCancel}
                  disabled={cancelLayaway.isPending}
                >
                  <Ban className="h-4 w-4" />
                  Cancelar Apartado
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment history */}
          <Card>
            <CardHeader>
              <CardTitle>Pagos ({layaway.payments?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {layaway.payments && layaway.payments.length > 0 ? (
                layaway.payments.map((p) => <LayawayPaymentRow key={p.id} payment={p} />)
              ) : (
                <p className="text-center text-sm text-muted-foreground">Sin pagos registrados</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min={0.01}
                step={0.01}
                {...paymentForm.register("amount", { valueAsNumber: true })}
              />
              {paymentForm.formState.errors.amount && (
                <p className="text-xs text-destructive">
                  {paymentForm.formState.errors.amount.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Restan {formatCurrency(remaining)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select
                value={paymentForm.watch("payment_method")}
                onValueChange={(v) => paymentForm.setValue("payment_method", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="mixed">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button type="submit" disabled={addPayment.isPending} className="flex-1">
                {addPayment.isPending ? "Guardando..." : "Registrar Pago"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}