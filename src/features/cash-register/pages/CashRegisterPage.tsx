import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import { openSessionUseCase } from "../application/openSession.usecase";
import { closeSessionUseCase } from "../application/closeSession.usecase";

export default function CashRegisterPage() {
  const { company, branch, user } = useAuth();
  const [openingBalance, setOpeningBalance] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [countedCash, setCountedCash] = useState(0);
  const [countedCard, setCountedCard] = useState(0);
  const [countedTransfer, setCountedTransfer] = useState(0);
  const [closingNotes, setClosingNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    if (!company?.id || !branch?.id || !user?.id) {
      toast.error("Contexto incompleto");
      return;
    }
    setLoading(true);
    try {
      const result = await openSessionUseCase(
        { company_id: company.id, branch_id: branch.id, cashier_user_id: user.id, opening_balance },
        ["cash.open"],
      );
      setSessionId(result.session_id);
      toast.success("Caja abierta correctamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al abrir caja");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (!sessionId || !company?.id || !user?.id) {
      toast.error("No hay sesion activa");
      return;
    }
    setLoading(true);
    try {
      await closeSessionUseCase(
        {
          session_id: sessionId,
          company_id: company.id,
          cashier_user_id: user.id,
          counted_cash: countedCash,
          counted_card: countedCard,
          counted_transfer: countedTransfer,
          notes: closingNotes || undefined,
        },
        ["cash.close"],
      );
      setSessionId(null);
      setCountedCash(0);
      setCountedCard(0);
      setCountedTransfer(0);
      setClosingNotes("");
      toast.success("Caja cerrada correctamente");
    } catch (e: any) {
      toast.error(e?.message || "Error al cerrar caja");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caja Registradora</h1>
          <p className="text-muted-foreground">Apertura y cierre de caja con arqueo.</p>
        </div>

        {!sessionId ? (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Abrir caja</CardTitle>
              <CardDescription>Registra el fondo inicial de caja.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fondo inicial</Label>
                <Input type="number" min="0" step="0.01" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value))} />
              </div>
              <Button onClick={handleOpen} disabled={loading || openingBalance < 0}>{loading ? "Abriendo..." : "Abrir caja"}</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Cerrar caja</CardTitle>
              <CardDescription>Sesión activa. Registra el arqueo completo del turno.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                <p><span className="font-medium">Sesión activa:</span> {sessionId}</p>
                <p className="text-muted-foreground">Captura los montos contados por método de pago antes de cerrar.</p>
              </div>
              <div className="space-y-2">
                <Label>Efectivo contado</Label>
                <Input type="number" min="0" step="0.01" value={countedCash} onChange={(e) => setCountedCash(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Tarjeta contada</Label>
                <Input type="number" min="0" step="0.01" value={countedCard} onChange={(e) => setCountedCard(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Transferencia contada</Label>
                <Input type="number" min="0" step="0.01" value={countedTransfer} onChange={(e) => setCountedTransfer(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Notas de cierre</Label>
                <Input value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Observaciones del arqueo o diferencias" />
              </div>
              <Button variant="destructive" onClick={handleClose} disabled={loading}>{loading ? "Cerrando..." : "Cerrar caja"}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
