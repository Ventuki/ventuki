-- Phase 9.2: Security hardening + posting flow for physical counts

CREATE OR REPLACE FUNCTION public.create_physical_count_with_items(
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _folio TEXT,
  _notes TEXT,
  _counted_by UUID,
  _items JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count_id UUID;
  _item JSONB;
  _product_id UUID;
  _counted_qty NUMERIC;
  _system_qty NUMERIC;
  _actor UUID;
BEGIN
  _actor := auth.uid();
  IF _actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied for company %', _company_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = _branch_id AND b.company_id = _company_id
  ) THEN
    RAISE EXCEPTION 'Branch % does not belong to company %', _branch_id, _company_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = _warehouse_id AND w.company_id = _company_id
  ) THEN
    RAISE EXCEPTION 'Warehouse % does not belong to company %', _warehouse_id, _company_id;
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty JSON array';
  END IF;

  INSERT INTO public.physical_counts (
    company_id, branch_id, warehouse_id, folio, notes, counted_by, status
  )
  VALUES (
    _company_id, _branch_id, _warehouse_id, _folio, _notes, COALESCE(_counted_by, _actor), 'draft'
  )
  RETURNING id INTO _count_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _product_id := (_item->>'product_id')::UUID;
    _counted_qty := COALESCE((_item->>'counted_qty')::NUMERIC, 0);

    IF _product_id IS NULL THEN
      RAISE EXCEPTION 'product_id is required in each item';
    END IF;

    IF _counted_qty < 0 THEN
      RAISE EXCEPTION 'counted_qty must be >= 0';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = _product_id AND p.company_id = _company_id
    ) THEN
      RAISE EXCEPTION 'Product % does not belong to company %', _product_id, _company_id;
    END IF;

    SELECT COALESCE(sl.quantity, 0)
      INTO _system_qty
    FROM public.stock_levels sl
    WHERE sl.company_id = _company_id
      AND sl.warehouse_id = _warehouse_id
      AND sl.product_id = _product_id
    LIMIT 1;

    INSERT INTO public.physical_count_items (
      company_id, count_id, product_id, system_qty, counted_qty
    )
    VALUES (
      _company_id, _count_id, _product_id, COALESCE(_system_qty, 0), _counted_qty
    );
  END LOOP;

  RETURN json_build_object('ok', true, 'count_id', _count_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.post_physical_count(
  _company_id UUID,
  _count_id UUID,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count RECORD;
  _item RECORD;
  _delta NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied for company %', _company_id;
  END IF;

  SELECT *
  INTO _count
  FROM public.physical_counts pc
  WHERE pc.id = _count_id
    AND pc.company_id = _company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Physical count % not found for company %', _count_id, _company_id;
  END IF;

  IF _count.status <> 'draft' THEN
    RAISE EXCEPTION 'Physical count % is not in draft status', _count_id;
  END IF;

  FOR _item IN
    SELECT * FROM public.physical_count_items pci
    WHERE pci.count_id = _count_id
      AND pci.company_id = _company_id
  LOOP
    _delta := COALESCE(_item.counted_qty, 0) - COALESCE(_item.system_qty, 0);

    IF _delta <> 0 THEN
      PERFORM public.adjust_stock(
        _company_id,
        _count.warehouse_id,
        _item.product_id,
        _delta,
        'count_adjustment',
        COALESCE(_notes, _count.notes, 'Physical count posting')
      );
    END IF;
  END LOOP;

  UPDATE public.physical_counts
  SET status = 'posted',
      posted_at = now(),
      notes = COALESCE(_notes, notes),
      updated_at = now()
  WHERE id = _count_id
    AND company_id = _company_id;

  RETURN json_build_object('ok', true, 'count_id', _count_id, 'status', 'posted');
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_physical_count(UUID, UUID, TEXT) TO authenticated;
