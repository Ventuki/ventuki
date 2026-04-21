import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";
import type { CartLine, CartSnapshot } from "../types/cart.types";
import { CartEntity } from "../domain/Cart.entity";
import { getProductsQuery } from "../application/queries/getProducts.query";
import { getCustomersQuery } from "../application/queries/getCustomers.query";
import { ensurePosReadyUseCase } from "../application/ensurePosReady.usecase";

export type ProductResult = { id: string; name: string; sku: string; price: number; stock: number };
export type CustomerResult = { id: string; full_name: string; tax_id?: string };
export type PaymentMethodResult = { id: string; name: string; code: string | null };
export type PaymentDraft = { id: string; method: string; amount: number; reference: string };

const CASH_METHOD_ALIASES = new Set(["cash", "efectivo", "cash_mxn"]);

function isCashMethod(method: string) {
  return CASH_METHOD_ALIASES.has(method.trim().toLowerCase());
}

function createEmptyCart(companyId?: string, branchId?: string): CartSnapshot {
  return {
    sale_id: crypto.randomUUID(),
    company_id: companyId || "",
    branch_id: branchId || "",
    warehouse_id: "",
    lines: [],
  };
}

function normalizeMoney(value: number | string): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Number(numeric.toFixed(2)));
}

export function usePOSCart() {
  const { company, branch, user } = useAuth();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 350);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [products, setProducts] = useState<ProductResult[]>([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<CustomerResult[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodResult[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentLines, setPaymentLines] = useState<PaymentDraft[]>([]);

  const [cart, setCart] = useState<CartSnapshot>(() => createEmptyCart(company?.id, branch?.id));
  const [processing, setProcessing] = useState(false);
  const [cashSessionReady, setCashSessionReady] = useState(false);
  const [checkingCashSession, setCheckingCashSession] = useState(false);
  const [warehouseReady, setWarehouseReady] = useState(false);
  const [checkingWarehouse, setCheckingWarehouse] = useState(false);
  const [paymentConfigReady, setPaymentConfigReady] = useState(false);

  const prevTenantRef = useRef<{ companyId?: string; branchId?: string }>({
    companyId: company?.id,
    branchId: branch?.id,
  });

  const totals = useMemo(() => new CartEntity(cart).totals(), [cart]);
  const totalPaid = useMemo(
    () => paymentLines.reduce((acc, line) => acc + normalizeMoney(line.amount || 0), 0),
    [paymentLines],
  );

  const syncTenantContext = useCallback(async () => {
    if (!company?.id || !branch?.id || !user?.id) {
      setWarehouseReady(false);
      setCashSessionReady(false);
      setPaymentConfigReady(false);
      return false;
    }

    setCheckingWarehouse(true);
    setCheckingCashSession(true);
    try {
      const readiness = await ensurePosReadyUseCase({
        company_id: company.id,
        branch_id: branch.id,
        cashier_user_id: user.id,
        current_warehouse_id: cart.branch_id === branch.id ? cart.warehouse_id || undefined : undefined,
      });

      if (!readiness.warehouseReady) {
        toast.error("No existe un almacén activo para esta sucursal");
      }

      if (!readiness.paymentConfigReady) {
        toast.error("No hay métodos de pago activos para esta empresa");
      }

      setWarehouseReady(readiness.warehouseReady);
      setCashSessionReady(readiness.cashSessionReady);
      setPaymentConfigReady(readiness.paymentConfigReady);
      setPaymentMethods(readiness.paymentMethods);

      const defaultMethod = readiness.paymentMethods[0]?.code || readiness.paymentMethods[0]?.id || "cash";
      setSelectedPaymentMethod(readiness.paymentConfigReady ? defaultMethod : "");
      setPaymentLines(
        readiness.paymentConfigReady
          ? [{ id: crypto.randomUUID(), method: defaultMethod, amount: 0, reference: "" }]
          : [],
      );

      setCart((prev) => {
        if (prev.company_id === company.id && prev.branch_id === branch.id && prev.warehouse_id === readiness.warehouse_id) {
          return prev;
        }
        return {
          ...prev,
          company_id: company.id,
          branch_id: branch.id,
          warehouse_id: readiness.warehouse_id,
        };
      });

      return readiness.warehouseReady;
    } catch (error) {
      console.error("[POS] error syncing readiness", error);
      toast.error(error instanceof Error ? error.message : "No se pudo validar la preparación del POS");
      setWarehouseReady(false);
      setCashSessionReady(false);
      setPaymentConfigReady(false);
      return false;
    } finally {
      setCheckingWarehouse(false);
      setCheckingCashSession(false);
    }
  }, [company?.id, branch?.id, user?.id, cart.warehouse_id, cart.branch_id]);

  useEffect(() => {
    const tenantChanged =
      prevTenantRef.current.companyId !== company?.id || prevTenantRef.current.branchId !== branch?.id;

    if (tenantChanged) {
      setCart(createEmptyCart(company?.id, branch?.id));
      setProducts([]);
      setSearch("");
      setCustomers([]);
      setCustomerSearch("");
      setSelectedCustomerId("");
      prevTenantRef.current = { companyId: company?.id, branchId: branch?.id };
      toast.info("Se actualizó el contexto de POS. El ticket fue reiniciado.");
    }
  }, [company?.id, branch?.id]);

  useEffect(() => {
    const run = async () => {
      try {
        await syncTenantContext();
      } catch (error) {
        console.error("[POS] error syncing tenant context", error);
        toast.error("No se pudo sincronizar el contexto de sucursal");
      }
    };

    run();
  }, [syncTenantContext]);


  const onSearchProducts = useCallback(
    async (term?: string) => {
      if (!company?.id || !branch?.id) {
        toast.error("Debes seleccionar empresa y sucursal");
        return;
      }

      const normalizedTerm = (term ?? search).trim();
      if (normalizedTerm.length < 2) {
        setProducts([]);
        return;
      }

      setLoadingSearch(true);
      try {
        const rows = await getProductsQuery(
          {
            company_id: company.id,
            branch_id: branch.id,
            warehouse_id: cart.warehouse_id || undefined,
          },
          normalizedTerm,
        );
        setProducts(rows);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "No se pudo consultar productos";
        toast.error(message);
      } finally {
        setLoadingSearch(false);
      }
    },
    [company?.id, branch?.id, search, cart.warehouse_id],
  );

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      onSearchProducts(debouncedSearch);
    } else if (debouncedSearch.length === 0) {
      setProducts([]);
    }
  }, [debouncedSearch, onSearchProducts]);

  const onSearchCustomers = useCallback(async () => {
    if (!company?.id || !branch?.id) {
      toast.error("Debes seleccionar empresa y sucursal");
      return;
    }

    try {
      const rows = await getCustomersQuery(
        {
          company_id: company.id,
          branch_id: branch.id,
          warehouse_id: cart.warehouse_id,
        },
        customerSearch.trim(),
      );
      setCustomers(rows);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudieron consultar clientes";
      toast.error(message);
    }
  }, [company?.id, branch?.id, cart.warehouse_id, customerSearch]);

  const addPaymentLine = () => {
    const fallbackMethod = selectedPaymentMethod || paymentMethods[0]?.code || paymentMethods[0]?.id || "cash";
    setPaymentLines((prev) => [...prev, { id: crypto.randomUUID(), method: fallbackMethod, amount: 0, reference: "" }]);
  };

  const removePaymentLine = (lineId: string) => {
    setPaymentLines((prev) => (prev.length > 1 ? prev.filter((line) => line.id !== lineId) : prev));
  };

  const updatePaymentLine = (lineId: string, patch: Partial<PaymentDraft>) => {
    setPaymentLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        return {
          ...line,
          ...patch,
          amount: patch.amount === undefined ? line.amount : normalizeMoney(patch.amount),
        };
      }),
    );
  };

  const addToCart = async (product: ProductResult) => {
    if (!(await syncTenantContext())) return;

    setCart((prev) => {
      const existing = prev.lines.find((line) => line.product_id === product.id);

      if (existing) {
        if (existing.quantity + 1 > existing.stock_available) {
          toast.error("Stock insuficiente");
          return prev;
        }

        return {
          ...prev,
          lines: prev.lines.map((line) =>
            line.product_id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          ),
        };
      }

      const line: CartLine = {
        id: crypto.randomUUID(),
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: 1,
        unit_price: product.price,
        tax_rate: 0.16,
        max_discount_percent: 30,
        discount_percent: 0,
        stock_available: product.stock,
      };

      if (line.stock_available <= 0) {
        toast.error("Producto sin stock");
        return prev;
      }

      return { ...prev, lines: [...prev.lines, line] };
    });
  };

  const removeFromCart = (lineId: string) => {
    setCart((prev) => ({ ...prev, lines: prev.lines.filter((line) => line.id !== lineId) }));
  };

  const clearCart = useCallback(() => {
    const defaultMethod = selectedPaymentMethod || paymentMethods[0]?.code || paymentMethods[0]?.id || "cash";
    setCart((prev) => ({ ...prev, sale_id: crypto.randomUUID(), lines: [] }));
    setSearch("");
    setProducts([]);
    setSelectedCustomerId("");
    setPaymentLines([{ id: crypto.randomUUID(), method: defaultMethod, amount: 0, reference: "" }]);
  }, [selectedPaymentMethod, paymentMethods]);

  const readinessChecklist = [
    {
      key: "cash-session",
      label: "Caja activa en la sucursal",
      ready: cashSessionReady,
      checking: checkingCashSession,
      hint: checkingCashSession
        ? "Validando estado de caja..."
        : cashSessionReady
          ? "Caja lista para registrar ventas."
          : "Abre una caja activa antes de cobrar.",
    },
    {
      key: "warehouse",
      label: "Almacén operativo disponible",
      ready: warehouseReady,
      checking: checkingWarehouse,
      hint: checkingWarehouse
        ? "Validando almacén operativo..."
        : warehouseReady
          ? "Almacén listo para descontar stock."
          : "Configura o activa un almacén para esta sucursal.",
    },
    {
      key: "payments",
      label: "Métodos de pago activos",
      ready: paymentConfigReady,
      checking: false,
      hint: paymentConfigReady
        ? "Ya existen métodos de pago para cobrar."
        : "Activa al menos un método de pago para operar el POS.",
    },
  ];

  const completeSale = async () => {
    if (!user?.id) {
      toast.error("No hay usuario autenticado");
      return;
    }

    if (checkingCashSession) {
      toast.error("Espera a que se valide el estado de caja");
      return;
    }

    if (!cashSessionReady) {
      toast.error("Debes abrir caja antes de cobrar en el POS");
      return;
    }

    if (checkingWarehouse) {
      toast.error("Espera a que se valide el almacén operativo");
      return;
    }

    if (!warehouseReady) {
      toast.error("No hay almacén operativo para esta sucursal");
      return;
    }

    if (!paymentConfigReady) {
      toast.error("No hay métodos de pago configurados para cobrar");
      return;
    }

    if (cart.lines.length === 0) {
      toast.error("Agrega productos antes de cobrar");
      return;
    }

    if (!company?.id || !branch?.id) {
      toast.error("Contexto de empresa/sucursal incompleto");
      return;
    }

    if (!cart.warehouse_id) {
      toast.error("No se encontró un almacén activo. Configura un almacén para esta sucursal antes de cobrar.");
      return;
    }

    const normalizedPayments = paymentLines
      .filter((line) => line.method && normalizeMoney(line.amount) > 0)
      .map((line) => ({
        method: line.method,
        amount: normalizeMoney(line.amount),
        reference: line.reference.trim() || undefined,
      }));

    if (normalizedPayments.length === 0) {
      toast.error("Captura al menos una línea de pago válida");
      return;
    }

    const missingReference = normalizedPayments.some((line) => {
      const methodCode = line.method.trim().toLowerCase();
      const isCash = CASH_METHOD_ALIASES.has(methodCode);
      return !isCash && !line.reference;
    });

    if (missingReference) {
      toast.error("Captura referencia para pagos no-efectivo");
      return;
    }

    if (totalPaid < totals.grand_total) {
      toast.error("El pago total es insuficiente");
      return;
    }

    const nonCashTotal = normalizedPayments
      .filter((line) => !isCashMethod(line.method))
      .reduce((acc, line) => acc + line.amount, 0);

    if (nonCashTotal > totals.grand_total) {
      toast.error("Los pagos no-efectivo no deben exceder el total de la venta");
      return;
    }

    const cashLines = normalizedPayments.filter((line) => isCashMethod(line.method));
    if (cashLines.length === 0 && totalPaid > totals.grand_total) {
      toast.error("El excedente solo se permite cuando hay pago en efectivo para calcular cambio");
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase.rpc("process_sale_transaction", {
        p_sale_params: {
          company_id: company.id,
          branch_id: branch.id,
          warehouse_id: cart.warehouse_id,
          cashier_user_id: user.id,
          customer_id: selectedCustomerId || null,
          invoice_requested: false,
        },
        p_cart_lines: cart.lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          discount_percent: l.discount_percent,
        })),
        p_payments: normalizedPayments,
      });

      if (error) {
        throw new Error(error.message || "Error procesando la venta (Atomic Rollback)");
      }

      const change = totalPaid - totals.grand_total;
      toast.success(`Venta registrada. Cambio: $${change.toFixed(2)}`);
      clearCart();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "No se pudo completar la venta";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return {
    search,
    setSearch,
    loadingSearch,
    products,
    onSearchProducts,

    customerSearch,
    setCustomerSearch,
    customers,
    onSearchCustomers,
    selectedCustomerId,
    setSelectedCustomerId,

    paymentMethods,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    paymentLines,
    totalPaid,
    addPaymentLine,
    removePaymentLine,
    updatePaymentLine,

    cart,
    totals,
    addToCart,
    removeFromCart,
    clearCart,

    completeSale,
    processing,
    cashSessionReady,
    checkingCashSession,
    warehouseReady,
    checkingWarehouse,
    paymentConfigReady,
    readinessChecklist,
    isCashMethod,
  };
}
