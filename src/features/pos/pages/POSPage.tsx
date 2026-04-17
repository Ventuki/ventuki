import { useEffect, useRef } from "react";
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
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Punto de Venta</h1>
          <p className="text-muted-foreground">Flujo rápido. Atajos: [F1] Cobrar, [F2] Buscar, [Esc] Limpiar.</p>
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
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
