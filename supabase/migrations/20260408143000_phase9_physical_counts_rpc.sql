-- Phase 9.1: atomic physical count creation with system_qty snapshot

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
BEGIN
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty JSON array';
  END IF;

  INSERT INTO public.physical_counts (
    company_id, branch_id, warehouse_id, folio, notes, counted_by, status
  )
  VALUES (
    _company_id, _branch_id, _warehouse_id, _folio, _notes, _counted_by, 'draft'
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

GRANT EXECUTE ON FUNCTION public.create_physical_count_with_items(UUID, UUID, UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;
