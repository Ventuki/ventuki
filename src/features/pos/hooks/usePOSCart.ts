import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth";
import { supabase } from "@/integrations/supabase/client";
import type { CartLine, CartSnapshot } from "../types/cart.types";
import { CartEntity } from "../domain/Cart.entity";
import { getProductsQuery } from "../application/queries/getProducts.query";
import { getCustomersQuery } from "../application/queries/getCustomers.query";
import { inventoryRepository } from "../infrastructure/inventory.repository";

export type ProductResult = { id: string; name: string; sku: string; price: number; stock: number };
export type CustomerResult = { id: string; full_name: string; tax_id?: string };
export type PaymentMethodResult = { id: string; name: string; code: string | null };
export type PaymentDraft = { id: string; method: string; amount: number; reference: string };

const CASH_METHOD_ALIASES = new Set(["cash", "efectivo", "cash_mxn"]);

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
    if (!company?.id || !branch?.id) return false;

    let activeWarehouseId = cart.warehouse_id;
    if (!activeWarehouseId || cart.branch_id !== branch.id) {
      const result = await inventoryRepository.getDefaultWarehouse(company.id, branch.id);
      const activeWarehouse = (result.data as { id: string } | null) || null;
      activeWarehouseId = activeWarehouse?.id || "";

      if (!activeWarehouseId) {
        toast.error("No existe un almacén activo para esta sucursal");
      }
    }

    setCart((prev) => {
      if (prev.company_id === company.id && prev.branch_id === branch.id && prev.warehouse_id === activeWarehouseId) {
        return prev;
      }
      return {
        ...prev,
        company_id: company.id,
        branch_id: branch.id,
        warehouse_id: activeWarehouseId,
      };
    });
    return !!activeWarehouseId;
  }, [company?.id, branch?.id, cart.warehouse_id, cart.branch_id]);

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

  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!company?.id) return;

      const { data, error } = await supabase
        .from("payment_methods")
        .select("id,name,code")
        .eq("company_id", company.id)
        .eq("is_active", true)
        .order("name");

      if (error) {
        toast.error(error.message || "No se pudieron cargar métodos de pago");
        return;
      }

      const rows = (data || []) as PaymentMethodResult[];
      setPaymentMethods(rows);

      const defaultMethod = rows[0]?.code || rows[0]?.id || "cash";
      setSelectedPaymentMethod(defaultMethod);
      setPaymentLines([{ id: crypto.randomUUID(), method: defaultMethod, amount: 0, reference: "" }]);
    };

    loadPaymentMethods();
  }, [company?.id]);

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

  const completeSale = async () => {
    if (!user?.id) {
      toast.error("No hay usuario autenticado");
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
  };
}
