-- Phase 9.3: enrich post_physical_count output with posting summary

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
  _adjusted_lines INTEGER := 0;
  _total_abs_delta NUMERIC := 0;
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

      _adjusted_lines := _adjusted_lines + 1;
      _total_abs_delta := _total_abs_delta + ABS(_delta);
    END IF;
  END LOOP;

  UPDATE public.physical_counts
  SET status = 'posted',
      posted_at = now(),
      notes = COALESCE(_notes, notes),
      updated_at = now()
  WHERE id = _count_id
    AND company_id = _company_id;

  RETURN json_build_object(
    'ok', true,
    'count_id', _count_id,
    'status', 'posted',
    'adjusted_lines', _adjusted_lines,
    'total_abs_delta', _total_abs_delta
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_physical_count(UUID, UUID, TEXT) TO authenticated;
