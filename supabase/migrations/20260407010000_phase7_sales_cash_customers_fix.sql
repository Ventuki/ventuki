-- ═══════════════════════════════════════════════════════════════════════
-- FASE 7: Correcciones críticas — sales, cash_movements, customers,
--         atomic payment, folio lock, suppliers dedup
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Tabla SALES (si no existe)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  cashier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID, -- FK soft: puede apuntar a la tabla customers cuando exista
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  currency TEXT NOT NULL DEFAULT 'MXN',
  subtotal NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  invoice_requested BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_company_branch ON public.sales(company_id, branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(company_id, status);

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their company sales" ON public.sales;
CREATE POLICY "Users see their company sales"
  ON public.sales FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users create sales in their company" ON public.sales;
CREATE POLICY "Users create sales in their company"
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users update own company sales" ON public.sales;
CREATE POLICY "Users update own company sales"
  ON public.sales FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

-- 2) Tabla SALE_ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(6,4) NOT NULL DEFAULT 0.16,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company sale_items" ON public.sale_items;
CREATE POLICY "Users see own company sale_items"
  ON public.sale_items FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company sale_items" ON public.sale_items;
CREATE POLICY "Users insert own company sale_items"
  ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 3) Tabla SALE_PAYMENTS
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  method TEXT NOT NULL CHECK (method IN ('cash','card','transfer','mixed','voucher')),
  amount NUMERIC(14,4) NOT NULL CHECK (amount > 0),
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON public.sale_payments(sale_id);

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company payments" ON public.sale_payments;
CREATE POLICY "Users see own company payments"
  ON public.sale_payments FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company payments" ON public.sale_payments;
CREATE POLICY "Users insert own company payments"
  ON public.sale_payments FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 4) Tabla CASH REGISTER SESSIONS
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE RESTRICT,
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opening_amount NUMERIC(14,4) NOT NULL DEFAULT 0,
  closing_amount NUMERIC(14,4),
  expected_amount NUMERIC(14,4),
  difference NUMERIC(14,4),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_company_register ON public.cash_register_sessions(company_id, cash_register_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_opened_by ON public.cash_register_sessions(opened_by);

ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company sessions" ON public.cash_register_sessions;
CREATE POLICY "Users see own company sessions"
  ON public.cash_register_sessions FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company sessions" ON public.cash_register_sessions;
CREATE POLICY "Users insert own company sessions"
  ON public.cash_register_sessions FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users update own company sessions" ON public.cash_register_sessions;
CREATE POLICY "Users update own company sessions"
  ON public.cash_register_sessions FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

-- 5) Tabla CASH MOVEMENTS
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.cash_register_sessions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','withdrawal','opening','closing')),
  amount NUMERIC(14,4) NOT NULL CHECK (amount > 0),
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_company ON public.cash_movements(company_id, branch_id, created_at DESC);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company cash_movements" ON public.cash_movements;
CREATE POLICY "Users see own company cash_movements"
  ON public.cash_movements FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company cash_movements" ON public.cash_movements;
CREATE POLICY "Users insert own company cash_movements"
  ON public.cash_movements FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 6) Tabla CUSTOMERS (con validación RFC y multi-tenant)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_type_id UUID REFERENCES public.customer_types(id) ON DELETE SET NULL,
  code TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  business_name TEXT,
  tax_id TEXT, -- RFC
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_tax_id_format CHECK (
    tax_id IS NULL OR (
      LENGTH(tax_id) >= 12 AND LENGTH(tax_id) <= 13
      AND tax_id ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_company_tax_id
  ON public.customers(company_id, tax_id)
  WHERE tax_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(company_id, email) WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company customers" ON public.customers;
CREATE POLICY "Users see own company customers"
  ON public.customers FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users manage own company customers" ON public.customers;
CREATE POLICY "Users manage own company customers"
  ON public.customers FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 7) FK de sales → customers
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS fk_sales_customer;
ALTER TABLE public.sales
  ADD CONSTRAINT fk_sales_customer
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- 7.5) Extender audit_logs para POS y otros módulos
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE public.audit_logs RENAME COLUMN user_id TO actor_user_id; -- Renombrar para consistencia
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8) FUNCIÓN ATÓMICA: process_sale_payment
--    Hace TODO el pago en una sola transacción DB:
--      a) valida venta en draft
--      b) descuenta stock para cada item (batch)
--      c) inserta pagos
--      d) actualiza sale a completed
--      e) registra ingreso en caja
--      f) genera audit log
CREATE OR REPLACE FUNCTION public.process_sale_payment(
  _sale_id UUID,
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _cashier_user_id UUID,
  _items JSONB,       -- [{product_id, quantity}]
  _payments JSONB,    -- [{method, amount, reference}]
  _totals JSONB       -- {subtotal, discount_total, tax_total, grand_total}
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
  -- Payloads tipados para evitar error de scalar si llegan como string
  _items_data JSONB;
  _payments_data JSONB;
  _totals_data JSONB;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  -- Normalizar inputs JSONB (PostgREST a veces envía strings-in-jsonb)
  _items_data := _items;
  IF jsonb_typeof(_items_data) = 'string' THEN _items_data := (_items_data#>>'{}')::jsonb; END IF;
  
  _payments_data := _payments;
  IF jsonb_typeof(_payments_data) = 'string' THEN _payments_data := (_payments_data#>>'{}')::jsonb; END IF;
  
  _totals_data := _totals;
  IF jsonb_typeof(_totals_data) = 'string' THEN _totals_data := (_totals_data#>>'{}')::jsonb; END IF;

  -- Verificar que la venta existe y está en draft
  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' AND _sale.status != 'draft_completed' THEN
    RAISE EXCEPTION 'La venta no está en estado borrador (estado actual: %)', _sale.status;
  END IF;

  -- Validar monto total de pagos
  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments_data) p;

  _grand_total := (_totals_data->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  -- Descontar stock (atómico)
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_data)
  LOOP
    PERFORM public.adjust_stock(
      _company_id,
      _warehouse_id,
      (_item->>'product_id')::UUID,
      -ABS((_item->>'quantity')::NUMERIC),
      'sale',
      'POS sale ' || _sale_id::TEXT
    );
  END LOOP;

  -- Insertar pagos
  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments_data)
  LOOP
    INSERT INTO public.sale_payments (sale_id, company_id, branch_id, warehouse_id, method, amount, reference, created_by)
    VALUES (
      _sale_id, _company_id, _branch_id, _warehouse_id,
      _payment->>'method',
      (_payment->>'amount')::NUMERIC,
      _payment->>'reference',
      _cashier_user_id
    );
  END LOOP;

  -- Actualizar totales y status de la venta
  UPDATE public.sales SET
    subtotal = (_totals_data->>'subtotal')::NUMERIC,
    discount_total = (_totals_data->>'discount_total')::NUMERIC,
    tax_total = (_totals_data->>'tax_total')::NUMERIC,
    total = _grand_total,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = _sale_id;

  -- Registrar ingreso en caja (buscar sesión activa)
  SELECT id INTO _active_session_id
  FROM public.cash_register_sessions
  WHERE company_id = _company_id AND branch_id = _branch_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, reference, created_by)
  VALUES (_company_id, _branch_id, _active_session_id, 'income', _grand_total, 'POS:' || _sale_id::TEXT, _cashier_user_id);

  -- Audit log (usando los nuevos nombres de columna)
  INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id, module)
  VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$$;

-- 9) FUNCIÓN: get_next_folio_locked (con advisory lock para evitar race condition)
CREATE OR REPLACE FUNCTION public.get_next_folio_locked(
  _company_id UUID,
  _branch_id UUID,
  _series TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next INTEGER;
  _lock_key BIGINT;
BEGIN
  -- Advisory lock basado en hash de company+branch+series
  _lock_key := abs(hashtext(_company_id::TEXT || _branch_id::TEXT || _series));
  PERFORM pg_advisory_xact_lock(_lock_key);

  SELECT COALESCE(MAX(folio), 0) + 1
  INTO _next
  FROM public.invoices
  WHERE company_id = _company_id AND branch_id = _branch_id AND series = _series;

  RETURN _next;
END;
$$;

-- 10) Fix: añadir company_id a purchase_items si no tiene
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Poblar company_id en purchase_items desde la orden padre
UPDATE public.purchase_items pi
SET company_id = p.company_id
FROM public.purchases p
WHERE pi.purchase_id = p.id
  AND pi.company_id IS NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_purchase_items_company ON public.purchase_items(company_id);

-- 11) Tabla de RBAC permissions cargada desde DB (vista materializada para cache)
CREATE TABLE IF NOT EXISTS public.user_permissions_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE public.user_permissions_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own permissions" ON public.user_permissions_cache;
CREATE POLICY "Users see own permissions"
  ON public.user_permissions_cache FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 12) Función: obtener permisos de usuario desde roles DB
CREATE OR REPLACE FUNCTION public.get_user_permissions(_company_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT (p.module || '.' || p.action))
  FROM public.company_users cu
  JOIN public.roles r ON r.company_id = cu.company_id AND r.name = cu.role::TEXT
  JOIN public.role_permissions rp ON rp.role_id = r.id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE cu.user_id = auth.uid()
    AND cu.company_id = _company_id
    AND cu.is_active = true;
$$;

-- 13) Función: open_cash_register_session
CREATE OR REPLACE FUNCTION public.open_cash_register_session(
  _company_id UUID,
  _branch_id UUID,
  _cash_register_id UUID,
  _opening_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _session_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  -- Verificar que no haya sesión abierta para este register
  IF EXISTS (
    SELECT 1 FROM public.cash_register_sessions
    WHERE cash_register_id = _cash_register_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Ya existe una sesión de caja abierta para esta caja';
  END IF;

  INSERT INTO public.cash_register_sessions (
    company_id, branch_id, cash_register_id, opened_by, status, opening_amount
  ) VALUES (
    _company_id, _branch_id, _cash_register_id, _user_id, 'open', _opening_amount
  ) RETURNING id INTO _session_id;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, notes, created_by)
  VALUES (_company_id, _branch_id, _session_id, 'opening', _opening_amount, 'Apertura de caja', _user_id);

  RETURN json_build_object('session_id', _session_id, 'status', 'open');
END;
$$;

-- 14) Función: close_cash_register_session
CREATE OR REPLACE FUNCTION public.close_cash_register_session(
  _session_id UUID,
  _closing_amount NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _session RECORD;
  _expected NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _session FROM public.cash_register_sessions
  WHERE id = _session_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sesión de caja no encontrada'; END IF;
  IF _session.status != 'open' THEN RAISE EXCEPTION 'La sesión ya está cerrada'; END IF;
  IF NOT public.has_company_access(_session.company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  -- Calcular efectivo esperado
  SELECT COALESCE(SUM(CASE WHEN type IN ('income','opening') THEN amount ELSE -amount END), 0)
  INTO _expected
  FROM public.cash_movements
  WHERE session_id = _session_id;

  UPDATE public.cash_register_sessions SET
    status = 'closed',
    closed_by = _user_id,
    closed_at = now(),
    closing_amount = _closing_amount,
    expected_amount = _expected,
    difference = _closing_amount - _expected,
    notes = COALESCE(_notes, notes)
  WHERE id = _session_id;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, notes, created_by)
  VALUES (_session.company_id, _session.branch_id, _session_id, 'closing', _closing_amount, 'Cierre de caja', _user_id);

  RETURN json_build_object(
    'session_id', _session_id,
    'expected', _expected,
    'closing', _closing_amount,
    'difference', _closing_amount - _expected
  );
END;
$$;
