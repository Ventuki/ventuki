import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth";
import { toast } from "sonner";
import { openSessionUseCase } from "../application/openSession.usecase";
import { closeSessionUseCase } from "../application/closeSession.usecase";
import { getSessionSummaryUseCase } from "../application/getSessionSummary.usecase";
import { listRecentSessionsUseCase } from "../application/listRecentSessions.usecase";
import { cashRegisterRepository } from "../infrastructure/cash.repository";
import { RecentSessionsPanel } from "../ui/RecentSessionsPanel";

const moneyFormatter = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export default function CashRegisterPage() {
  const { company, branch, user } = useAuth();
  const [openingBalance, setOpeningBalance] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [sessionTotals, setSessionTotals] = useState<any | null>(null);
  const [countedCash, setCountedCash] = useState(0);
  const [countedCard, setCountedCard] = useState(0);
  const [countedTransfer, setCountedTransfer] = useState(0);
  const [closingNotes, setClosingNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [recentSessions, setRecentSessions] = useState<Array<{ id: string; opened_at: string | null; closed_at: string | null; opening_amount: number | null; difference: number | null; status?: string | null }>>([]);

  const expectedCash = Number(sessionTotals?.total_cash || 0);
  const expectedCard = Number(sessionTotals?.total_card || 0);
  const expectedTransfer = Number(sessionTotals?.total_transfer || 0);

  const cashDifference = countedCash - expectedCash;
  const cardDifference = countedCard - expectedCard;
  const transferDifference = countedTransfer - expectedTransfer;

  const totalDifference = useMemo(() => {
    if (!sessionTotals) return null;
    return cashDifference + cardDifference + transferDifference;
  }, [sessionTotals, cashDifference, cardDifference, transferDifference]);

  useEffect(() => {
    const loadActiveSession = async () => {
      if (!company?.id || !branch?.id || !user?.id) {
        setSessionId(null);
        setActiveSession(null);
        setSessionTotals(null);
        return;
      }

      setLoadingSession(true);
      const recent = await listRecentSessionsUseCase({
        company_id: company.id,
        branch_id: branch.id,
        cashier_user_id: user.id,
        limit: 5,
      }).catch(() => []);
      setRecentSessions(recent);

      const { session, error } = await cashRegisterRepository.getActiveSession(company.id, branch.id, user.id);

      if (error) {
        toast.error("No se pudo cargar la sesión activa de caja");
        setLoadingSession(false);
        return;
      }

      if (!session) {
        setSessionId(null);
        setActiveSession(null);
        setSessionTotals(null);
        setLoadingSession(false);
        return;
      }

      setSessionId(session.id);
      setActiveSession(session);

      try {
        const summary = await getSessionSummaryUseCase({ session_id: session.id, company_id: company.id });
        setSessionTotals(summary.totals);
      } catch {
        toast.error("No se pudo cargar el resumen de la sesión activa");
      }

      setLoadingSession(false);
    };

    loadActiveSession();
  }, [company?.id, branch?.id, user?.id]);

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
      try {
        const summary = await getSessionSummaryUseCase({ session_id: result.session_id, company_id: company.id });
        setActiveSession(summary.session);
        setSessionTotals(summary.totals);
      } catch {
        toast.error("No se pudo cargar el resumen de la sesión recién abierta");
      }
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
      setActiveSession(null);
      setSessionTotals(null);
      setCountedCash(0);
      setCountedCard(0);
      setCountedTransfer(0);
      setClosingNotes("");
      const recent = await listRecentSessionsUseCase({
        company_id: company.id,
        branch_id: branch.id,
        cashier_user_id: user.id,
        limit: 5,
      }).catch(() => []);
      setRecentSessions(recent);
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

        {loadingSession ? (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Validando caja activa</CardTitle>
              <CardDescription>Cargando el contexto actual de caja para esta sucursal.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Espera un momento...</p>
            </CardContent>
          </Card>
        ) : !sessionId ? (
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
                <p><span className="font-medium">Apertura:</span> {activeSession?.opened_at ? new Date(activeSession.opened_at).toLocaleString("es-MX") : "Sin dato"}</p>
                <p><span className="font-medium">Fondo inicial:</span> ${Number(activeSession?.opening_amount || 0).toFixed(2)}</p>
                <p className="text-muted-foreground">Captura los montos contados por método de pago antes de cerrar.</p>
              </div>

              {sessionTotals && (
                <div className="space-y-3 rounded-md border bg-primary/5 p-3 text-sm">
                  <p className="font-medium">Resumen esperado del turno</p>

                  <div className="space-y-2 rounded-md border bg-background/80 p-3">
                    <div className="flex items-center justify-between">
                      <span>Efectivo esperado</span>
                      <span className="font-medium">{moneyFormatter.format(expectedCash)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Efectivo contado</span>
                      <span>{moneyFormatter.format(countedCash)}</span>
                    </div>
                    <div className={`flex items-center justify-between font-medium ${cashDifference === 0 ? "text-success" : "text-warning"}`}>
                      <span>Diferencia efectivo</span>
                      <span>{moneyFormatter.format(cashDifference)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border bg-background/80 p-3">
                    <div className="flex items-center justify-between">
                      <span>Tarjeta esperada</span>
                      <span className="font-medium">{moneyFormatter.format(expectedCard)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Tarjeta contada</span>
                      <span>{moneyFormatter.format(countedCard)}</span>
                    </div>
                    <div className={`flex items-center justify-between font-medium ${cardDifference === 0 ? "text-success" : "text-warning"}`}>
                      <span>Diferencia tarjeta</span>
                      <span>{moneyFormatter.format(cardDifference)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border bg-background/80 p-3">
                    <div className="flex items-center justify-between">
                      <span>Transferencia esperada</span>
                      <span className="font-medium">{moneyFormatter.format(expectedTransfer)}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Transferencia contada</span>
                      <span>{moneyFormatter.format(countedTransfer)}</span>
                    </div>
                    <div className={`flex items-center justify-between font-medium ${transferDifference === 0 ? "text-success" : "text-warning"}`}>
                      <span>Diferencia transferencia</span>
                      <span>{moneyFormatter.format(transferDifference)}</span>
                    </div>
                  </div>

                  {totalDifference !== null && (
                    <div className={`rounded-md border p-3 font-medium ${totalDifference === 0 ? "border-success/30 bg-success/5 text-success" : "border-warning/30 bg-warning/5 text-warning"}`}>
                      Diferencia total proyectada: {moneyFormatter.format(totalDifference)}
                    </div>
                  )}
                </div>
              )}

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

        <RecentSessionsPanel rows={recentSessions} />
      </div>
    </AppLayout>
  );
}
