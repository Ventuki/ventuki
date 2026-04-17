-- Fase 4: Compras y Entradas

CREATE TYPE public.purchase_status AS ENUM (
  'draft',
  'confirmed',
  'partial',
  'received',
  'cancelled'
);

CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_type_id UUID REFERENCES public.supplier_types(id) ON DELETE SET NULL,
  code TEXT,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name),
  UNIQUE(company_id, code)
);
CREATE INDEX idx_suppliers_company ON public.suppliers(company_id);
CREATE INDEX idx_suppliers_type ON public.suppliers(supplier_type_id);

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  folio TEXT,
  status public.purchase_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  expected_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchases_company ON public.purchases(company_id, created_at DESC);
CREATE INDEX idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_status ON public.purchases(company_id, status);

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  received_qty NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  unit_cost NUMERIC(12,4) NOT NULL CHECK (unit_cost >= 0),
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT purchase_items_received_lte_qty CHECK (received_qty <= quantity)
);
CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON public.purchase_items(product_id);

CREATE TABLE public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchase_receipts_purchase ON public.purchase_receipts(purchase_id, created_at DESC);

CREATE TABLE public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  purchase_item_id UUID NOT NULL REFERENCES public.purchase_items(id) ON DELETE RESTRICT,
  quantity_received NUMERIC(12,3) NOT NULL CHECK (quantity_received > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(receipt_id, purchase_item_id)
);
CREATE INDEX idx_purchase_receipt_items_receipt ON public.purchase_receipt_items(receipt_id);

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recompute_purchase_totals(_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subtotal NUMERIC(12,2);
  _tax_total NUMERIC(12,2);
  _total NUMERIC(12,2);
BEGIN
  SELECT
    COALESCE(SUM(COALESCE(pi.quantity, 0) * COALESCE(pi.unit_cost, 0)), 0),
    COALESCE(SUM((COALESCE(pi.quantity, 0) * COALESCE(pi.unit_cost, 0)) * COALESCE(pi.tax_rate, 0)), 0),
    COALESCE(SUM((COALESCE(pi.quantity, 0) * COALESCE(pi.unit_cost, 0)) * (1 + COALESCE(pi.tax_rate, 0))), 0)
  INTO _subtotal, _tax_total, _total
  FROM public.purchase_items pi
  WHERE pi.purchase_id = _purchase_id;

  UPDATE public.purchases
  SET subtotal = _subtotal,
      tax_total = _tax_total,
      total = _total,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = _purchase_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_items_set_total_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total := ROUND((NEW.quantity * NEW.unit_cost) * (1 + COALESCE(NEW.tax_rate, 0)), 2);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_items_recompute_totals_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _purchase_id UUID;
BEGIN
  _purchase_id := COALESCE(NEW.purchase_id, OLD.purchase_id);
  PERFORM public.recompute_purchase_totals(_purchase_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchase_items_set_total
BEFORE INSERT OR UPDATE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.purchase_items_set_total_trigger();

CREATE TRIGGER trg_purchase_items_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.purchase_items_recompute_totals_trigger();

CREATE OR REPLACE FUNCTION public.receive_purchase(
  _purchase_id UUID,
  _warehouse_id UUID,
  _items JSONB,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _purchase RECORD;
  _receipt_id UUID;
  _line JSONB;
  _purchase_item RECORD;
  _qty NUMERIC(12,3);
  _remaining NUMERIC(12,3);
  _new_status public.purchase_status;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _purchase
  FROM public.purchases p
  WHERE p.id = _purchase_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF NOT public.has_company_access(_purchase.company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  IF _purchase.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Purchase status does not allow receiving';
  END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Items payload must be a non-empty array';
  END IF;

  INSERT INTO public.purchase_receipts (purchase_id, warehouse_id, received_by, notes)
  VALUES (_purchase_id, _warehouse_id, _user_id, _notes)
  RETURNING id INTO _receipt_id;

  FOR _line IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _qty := COALESCE((_line->>'quantity_received')::NUMERIC, 0);

    IF _qty <= 0 THEN
      RAISE EXCEPTION 'quantity_received must be > 0';
    END IF;

    SELECT pi.*
    INTO _purchase_item
    FROM public.purchase_items pi
    WHERE pi.id = (_line->>'purchase_item_id')::UUID
      AND pi.purchase_id = _purchase_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Purchase item not found in purchase';
    END IF;

    _remaining := _purchase_item.quantity - _purchase_item.received_qty;
    IF _qty > _remaining THEN
      RAISE EXCEPTION 'Received qty exceeds pending qty for item %', _purchase_item.id;
    END IF;

    INSERT INTO public.purchase_receipt_items (receipt_id, purchase_item_id, quantity_received)
    VALUES (_receipt_id, _purchase_item.id, _qty);

    UPDATE public.purchase_items
    SET received_qty = received_qty + _qty
    WHERE id = _purchase_item.id;

    PERFORM public.adjust_stock(
      _purchase.company_id,
      _warehouse_id,
      _purchase_item.product_id,
      _qty,
      'purchase',
      COALESCE(_notes, 'Entrada por recepción de compra ' || COALESCE(_purchase.folio, _purchase.id::TEXT))
    );
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.purchase_items pi
    WHERE pi.purchase_id = _purchase_id
      AND pi.received_qty > 0
      AND pi.received_qty < pi.quantity
  ) THEN
    _new_status := 'partial';
  ELSIF EXISTS (
    SELECT 1
    FROM public.purchase_items pi
    WHERE pi.purchase_id = _purchase_id
      AND pi.received_qty = pi.quantity
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.purchase_items pi
    WHERE pi.purchase_id = _purchase_id
      AND pi.received_qty < pi.quantity
  ) THEN
    _new_status := 'received';
  ELSE
    _new_status := 'confirmed';
  END IF;

  UPDATE public.purchases
  SET status = _new_status,
      updated_at = now(),
      updated_by = _user_id
  WHERE id = _purchase_id;

  RETURN json_build_object(
    'purchase_id', _purchase_id,
    'receipt_id', _receipt_id,
    'status', _new_status
  );
END;
$$;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see suppliers of their companies" ON public.suppliers FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers purchasers manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
)
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
);

CREATE POLICY "Users see purchases of their companies" ON public.purchases FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers purchasers manage purchases" ON public.purchases FOR ALL TO authenticated
USING (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
)
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
);

CREATE POLICY "Users see purchase_items of their companies" ON public.purchase_items FOR SELECT TO authenticated
USING (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE p.company_id IN (SELECT public.get_user_company_ids())
));
CREATE POLICY "Admins managers purchasers manage purchase_items" ON public.purchase_items FOR ALL TO authenticated
USING (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
))
WITH CHECK (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
));

CREATE POLICY "Users see purchase_receipts of their companies" ON public.purchase_receipts FOR SELECT TO authenticated
USING (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE p.company_id IN (SELECT public.get_user_company_ids())
));
CREATE POLICY "Admins managers purchasers warehouse receive purchases" ON public.purchase_receipts FOR INSERT TO authenticated
WITH CHECK (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
     OR public.has_role_in_company(p.company_id, 'warehouse_keeper')
));

CREATE POLICY "Users see purchase_receipt_items of their companies" ON public.purchase_receipt_items FOR SELECT TO authenticated
USING (receipt_id IN (
  SELECT pr.id
  FROM public.purchase_receipts pr
  JOIN public.purchases p ON p.id = pr.purchase_id
  WHERE p.company_id IN (SELECT public.get_user_company_ids())
));
CREATE POLICY "Admins managers purchasers warehouse manage purchase_receipt_items" ON public.purchase_receipt_items FOR INSERT TO authenticated
WITH CHECK (receipt_id IN (
  SELECT pr.id
  FROM public.purchase_receipts pr
  JOIN public.purchases p ON p.id = pr.purchase_id
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
     OR public.has_role_in_company(p.company_id, 'warehouse_keeper')
));
