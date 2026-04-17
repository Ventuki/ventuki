-- =====================================================
-- FIX FASE2-6: RPC transaccional create_purchase_with_items
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_purchase_with_items(
  _company_id UUID,
  _branch_id UUID,
  _supplier_id UUID,
  _folio TEXT DEFAULT NULL,
  _expected_date DATE DEFAULT NULL,
  _notes TEXT DEFAULT NULL,
  _items JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _purchase_id UUID;
  _item JSONB;
  _qty NUMERIC;
  _unit_cost NUMERIC;
  _tax_rate NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Items must be a non-empty array';
  END IF;

  INSERT INTO public.purchases (company_id, branch_id, supplier_id, folio, expected_date, notes, status, created_by)
  VALUES (_company_id, _branch_id, _supplier_id, _folio, _expected_date, _notes, 'draft', _user_id)
  RETURNING id INTO _purchase_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _qty       := (_item->>'quantity')::NUMERIC;
    _unit_cost := (_item->>'unit_cost')::NUMERIC;
    _tax_rate  := COALESCE((_item->>'tax_rate')::NUMERIC, 0);

    IF _qty <= 0 THEN RAISE EXCEPTION 'quantity must be > 0'; END IF;
    IF _unit_cost < 0 THEN RAISE EXCEPTION 'unit_cost must be >= 0'; END IF;

    INSERT INTO public.purchase_items (company_id, purchase_id, product_id, quantity, unit_cost, tax_rate, received_qty)
    VALUES (
      _company_id,
      _purchase_id,
      (_item->>'product_id')::UUID,
      _qty,
      _unit_cost,
      _tax_rate,
      0
    );
  END LOOP;

  -- Recalcular totales via trigger existente
  PERFORM public.recompute_purchase_totals(_purchase_id);

  RETURN json_build_object('purchase_id', _purchase_id, 'status', 'draft');
END;
$$;


-- =====================================================
-- FIX FASE2-7: Tabla inventory_transfers + fix tax_rate docs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  from_warehouse UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  to_warehouse UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,3) NOT NULL CHECK (qty > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
  notes TEXT,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transfers_company ON public.inventory_transfers(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_product ON public.inventory_transfers(product_id);

ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company inventory_transfers" ON public.inventory_transfers;
CREATE POLICY "Users see own company inventory_transfers" ON public.inventory_transfers FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users manage own company inventory_transfers" ON public.inventory_transfers FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));


-- =====================================================
-- FIX FASE2-8: Cash Register — corregir BD para alinear con frontend
-- =====================================================

-- 8a. Agregar columnas faltantes a cash_register_sessions para cierre detallado
ALTER TABLE public.cash_register_sessions
  ADD COLUMN IF NOT EXISTS counted_cash NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS counted_card NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS counted_transfer NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS calculated_cash NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS calculated_card NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS calculated_transfer NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS closing_notes TEXT;

-- 8b. Agregar columnas faltantes a cash_movements
ALTER TABLE public.cash_movements
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 8c. Ampliar CHECK constraint de cash_movements.type para incluir 'deposit'
ALTER TABLE public.cash_movements DROP CONSTRAINT IF EXISTS cash_movements_type_check;
ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_type_check
  CHECK (type IN ('income','expense','withdrawal','opening','closing','deposit'));

-- 8d. Agregar columna opening_balance como alias (compatibilidad con RPC existente)
ALTER TABLE public.cash_register_sessions
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,4) GENERATED ALWAYS AS (opening_amount) STORED;


-- =====================================================
-- FIX FASE2-8e: Reescribir calculate_cash_session_totals 
--     Ahora usa payment_method que ya existe
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_cash_session_totals(_session_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_cash NUMERIC := 0;
  _total_card NUMERIC := 0;
  _total_transfer NUMERIC := 0;
  _opening_amount NUMERIC := 0;
  _company_id UUID;
BEGIN
  SELECT company_id, opening_amount INTO _company_id, _opening_amount
  FROM public.cash_register_sessions
  WHERE id = _session_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sesion no encontrada'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No access'; END IF;

  -- Efectivo: fondo inicial + movimientos cash
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('income','deposit','opening') THEN amount
      WHEN type IN ('expense','withdrawal','closing') THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_cash
  FROM public.cash_movements
  WHERE session_id = _session_id AND (payment_method = 'cash' OR payment_method IS NULL);

  _total_cash := _total_cash + _opening_amount;

  -- Tarjeta
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('income','deposit') THEN amount
      WHEN type IN ('expense','withdrawal') THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_card
  FROM public.cash_movements
  WHERE session_id = _session_id AND payment_method = 'card';

  -- Transferencia
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('income','deposit') THEN amount
      WHEN type IN ('expense','withdrawal') THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_transfer
  FROM public.cash_movements
  WHERE session_id = _session_id AND payment_method = 'transfer';

  RETURN json_build_object(
    'total_cash', _total_cash,
    'total_card', _total_card,
    'total_transfer', _total_transfer
  );
END;
$$;