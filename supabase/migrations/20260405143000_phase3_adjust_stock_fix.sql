-- Hardening fase 3: corregir ajuste de stock negativo al crear fila inexistente

CREATE OR REPLACE FUNCTION public.adjust_stock(
  _company_id UUID,
  _warehouse_id UUID,
  _product_id UUID,
  _delta NUMERIC,
  _movement_type public.inventory_movement_type DEFAULT 'adjustment_in',
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_qty NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  IF _delta = 0 THEN
    RAISE EXCEPTION 'Delta cannot be zero';
  END IF;

  IF _delta < 0 AND NOT EXISTS (
    SELECT 1
    FROM public.stock_levels sl
    WHERE sl.company_id = _company_id
      AND sl.warehouse_id = _warehouse_id
      AND sl.product_id = _product_id
  ) THEN
    RAISE EXCEPTION 'Cannot decrease stock that does not exist';
  END IF;

  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity)
  VALUES (_company_id, _warehouse_id, _product_id, _delta)
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET quantity = public.stock_levels.quantity + _delta,
                updated_at = now()
  RETURNING quantity INTO _new_qty;

  IF _new_qty < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative';
  END IF;

  INSERT INTO public.stock_movements (
    company_id,
    warehouse_id,
    product_id,
    movement_type,
    quantity,
    balance_after,
    notes,
    created_by
  )
  VALUES (
    _company_id,
    _warehouse_id,
    _product_id,
    _movement_type,
    _delta,
    _new_qty,
    _notes,
    auth.uid()
  );

  RETURN json_build_object(
    'company_id', _company_id,
    'warehouse_id', _warehouse_id,
    'product_id', _product_id,
    'new_quantity', _new_qty
  );
END;
$$;
