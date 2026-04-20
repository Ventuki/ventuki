import { useEffect, useRef } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AppLayout } from "@/components/layout";
import { usePOSCart } from "../hooks/usePOSCart";
import { POSCatalog } from "../components/POSCatalog";
import { POSCart } from "../components/POSCart";

function isTypingContext(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
}

export default function POSPage() {
  const cartHook = usePOSCart();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingContext(e.target);

      if (e.key === "F1") {
        e.preventDefault();
        cartHook.completeSale();
        return;
      }

      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "Escape" && !typing) {
        e.preventDefault();
        cartHook.clearCart();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cartHook.completeSale, cartHook.clearCart]);

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
        <div className="mb-4 space-y-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Punto de Venta</h1>
            <p className="text-muted-foreground">Flujo rápido. Atajos: [F1] Cobrar, [F2] Buscar, [Esc] Limpiar.</p>
          </div>

          {(!cartHook.cashSessionReady || !cartHook.warehouseReady || !cartHook.paymentConfigReady) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>POS no listo para cobrar</AlertTitle>
              <AlertDescription className="space-y-3">
                <p>Faltan precondiciones operativas. Revisa este checklist antes de intentar cobrar.</p>
                <div className="space-y-2 text-sm">
                  {cartHook.readinessChecklist.map((item) => (
                    <div key={item.key} className="rounded-md border border-destructive/20 bg-background/70 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{item.label}</span>
                        <span className={`text-xs font-semibold ${item.ready ? "text-emerald-600" : item.checking ? "text-amber-600" : "text-destructive"}`}>
                          {item.ready ? "Listo" : item.checking ? "Validando" : "Pendiente"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-12 flex-1 min-h-0 opacity-0 animate-[fade-in_0.5s_ease-out_0.2s_forwards]">
          <div className="lg:col-span-7 xl:col-span-8 min-h-0 h-full">
            <POSCatalog
              ref={searchInputRef}
              search={cartHook.search}
              onSearchChange={cartHook.setSearch}
              onSearchSubmit={() => cartHook.onSearchProducts(cartHook.search)}
              loadingSearch={cartHook.loadingSearch}
              products={cartHook.products}
              onAddToCart={cartHook.addToCart}
              cashSessionReady={cartHook.cashSessionReady}
              warehouseReady={cartHook.warehouseReady}
              paymentConfigReady={cartHook.paymentConfigReady}
            />
          </div>

          <div className="lg:col-span-5 xl:col-span-4 min-h-0 h-full">
            <POSCart
              cart={cartHook.cart}
              totals={cartHook.totals}
              onRemoveFromCart={cartHook.removeFromCart}
              onCompleteSale={cartHook.completeSale}
              processing={cartHook.processing}
              onClearCart={cartHook.clearCart}
              cashSessionReady={cartHook.cashSessionReady}
              checkingCashSession={cartHook.checkingCashSession}
              warehouseReady={cartHook.warehouseReady}
              checkingWarehouse={cartHook.checkingWarehouse}
              paymentConfigReady={cartHook.paymentConfigReady}
              customerSearch={cartHook.customerSearch}
              onCustomerSearchChange={cartHook.setCustomerSearch}
              onSearchCustomers={cartHook.onSearchCustomers}
              customers={cartHook.customers}
              selectedCustomerId={cartHook.selectedCustomerId}
              onCustomerChange={cartHook.setSelectedCustomerId}
              paymentMethods={cartHook.paymentMethods}
              paymentLines={cartHook.paymentLines}
              onAddPaymentLine={cartHook.addPaymentLine}
              onRemovePaymentLine={cartHook.removePaymentLine}
              onUpdatePaymentLine={cartHook.updatePaymentLine}
              totalPaid={cartHook.totalPaid}
              isCashMethod={cartHook.isCashMethod}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
