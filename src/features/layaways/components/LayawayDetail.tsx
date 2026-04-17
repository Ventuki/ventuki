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
import { useRenewLayaway } from "../hooks/useRenewLayaway";
import { addPaymentSchema, type AddPaymentFormValues } from "../schemas/layaway.schema";
import {
  formatCurrency,
  getRemainingAmount,
  getProgressPercent,
  customerDisplayName,
  STATUS_COLORS,
  STATUS_LABELS,
  isLayawayOverdue,
  extractLayawayRenewals,
  getLayawayGeneralNotes,
} from "../utils";
import { LayawayItemRow } from "./LayawayItemRow";
import { LayawayPaymentRow } from "./LayawayPaymentRow";

export function LayawayDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: layaway, isLoading } = useLayawayDetail(id ?? null);
  const cancelLayaway = useCancelLayaway();
  const addPayment = useAddLayawayPayment();
  const renewLayaway = useRenewLayaway();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [renewDueDate, setRenewDueDate] = useState("");
  const [renewalNote, setRenewalNote] = useState("");

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
  const overdue = isLayawayOverdue(layaway);
  const renewals = extractLayawayRenewals(layaway.notes);
  const generalNotes = getLayawayGeneralNotes(layaway.notes);

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

  const handleRenewLayaway = async () => {
    if (!id || !renewDueDate.trim() || !renewalNote.trim()) return;
    await renewLayaway.mutateAsync({
      layaway_id: id,
      due_date: renewDueDate,
      renewal_note: renewalNote,
    });
    setShowRenewDialog(false);
    setRenewDueDate("");
    setRenewalNote("");
  };

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
            Cliente: {customerName} , Creado el {new Date(layaway.created_at).toLocaleDateString("es-MX")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resumen</CardTitle>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[layaway.status]}`}>
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
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(layaway.paid_amount)}</p>
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
                <div className={`rounded-md border p-3 text-sm space-y-1 ${overdue ? "bg-red-50 text-red-900" : "bg-muted/30"}`}>
                  <p><span className="font-medium">Fecha límite del apartado:</span> {new Date(layaway.due_date).toLocaleDateString("es-MX")}</p>
                  {overdue ? (
                    <p>Este apartado está vencido. Revisa si debe renovarse, cobrarse o cancelarse según la política del negocio.</p>
                  ) : (
                    <p>Este apartado sigue dentro de su vigencia operativa.</p>
                  )}
                </div>
              )}
              {layaway.status === "active" && (
                <div className="rounded-md border bg-amber-50 p-3 text-sm text-amber-950 space-y-1">
                  <p><span className="font-medium">Regla operativa:</span> este apartado mantiene mercancía comprometida para el cliente.</p>
                  <p>Mientras siga activo, ese stock no debe tratarse como disponible para venta libre.</p>
                  {overdue && <p className="font-medium text-red-700">Al estar vencido, conviene revisar renovación, liquidación o cancelación.</p>}
                </div>
              )}
              {generalNotes && <p className="text-sm text-muted-foreground whitespace-pre-line">Notas: {generalNotes}</p>}
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
                    {layaway.items.map((item) => <LayawayItemRow key={item.id} item={item} />)}
                  </tbody>
                </table>
              ) : (
                <p className="p-4 text-center text-muted-foreground">Sin productos</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {layaway.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" onClick={() => setShowPaymentDialog(true)} disabled={overdue}>
                  <Banknote className="h-4 w-4" />
                  Agregar Abono
                </Button>
                {overdue && (
                  <Button variant="secondary" className="w-full gap-2" onClick={() => setShowRenewDialog(true)}>
                    Renovar Apartado
                  </Button>
                )}
                <Button variant="outline" className="w-full gap-2 text-destructive hover:bg-destructive/10" onClick={handleCancel} disabled={cancelLayaway.isPending}>
                  <Ban className="h-4 w-4" />
                  Cancelar Apartado
                </Button>
                {overdue && (
                  <p className="text-xs text-muted-foreground">
                    Los abonos quedan bloqueados mientras el apartado esté vencido. Primero debe renovarse o resolverse operativamente.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial operativo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {renewals.length > 0 ? (
                renewals.map((entry, index) => (
                  <div key={`${entry.happenedAt}-${index}`} className="rounded-md border px-3 py-2 text-sm">
                    <p className="font-medium">Renovación</p>
                    <p className="text-xs text-muted-foreground">Cuándo: {entry.happenedAt || "Sin fecha"}</p>
                    <p className="mt-1 text-muted-foreground">Por qué: {entry.note || "Sin detalle"}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground">Sin renovaciones registradas</p>
              )}
            </CardContent>
          </Card>

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

      <Dialog open={showPaymentDialog && !overdue} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" min={0.01} step={0.01} {...paymentForm.register("amount", { valueAsNumber: true })} />
              {paymentForm.formState.errors.amount && <p className="text-xs text-destructive">{paymentForm.formState.errors.amount.message}</p>}
              <p className="text-xs text-muted-foreground">Restan {formatCurrency(remaining)}</p>
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={paymentForm.watch("payment_method")} onValueChange={(v) => paymentForm.setValue("payment_method", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Apartado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva fecha límite</Label>
              <Input type="date" value={renewDueDate} onChange={(e) => setRenewDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Motivo / nota de renovación</Label>
              <Input value={renewalNote} onChange={(e) => setRenewalNote(e.target.value)} placeholder="Ej. cliente confirmó pago el lunes" />
            </div>
            <Button onClick={handleRenewLayaway} disabled={renewLayaway.isPending || !renewDueDate.trim() || !renewalNote.trim()} className="w-full">
              {renewLayaway.isPending ? "Renovando..." : "Confirmar renovación"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
