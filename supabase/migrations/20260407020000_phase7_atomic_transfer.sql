-- ═══════════════════════════════════════════════════════════════════════
-- FASE 3 Corrección: Transferencia de Stock Atómica
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transfer_stock(
  _company_id UUID,
  _from_warehouse_id UUID,
  _to_warehouse_id UUID,
  _product_id UUID,
  _quantity NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _from_qty NUMERIC;
  _to_qty NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;
  IF _quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
  IF _from_warehouse_id = _to_warehouse_id THEN RAISE EXCEPTION 'Cannot transfer to the same warehouse'; END IF;

  -- 1. Descontar del almacén origen
  UPDATE public.stock_levels
  SET quantity = quantity - _quantity,
      updated_at = now()
  WHERE company_id = _company_id
    AND warehouse_id = _from_warehouse_id
    AND product_id = _product_id
  RETURNING quantity INTO _from_qty;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock not found in source warehouse';
  END IF;

  IF _from_qty < 0 THEN
    RAISE EXCEPTION 'Insufficient stock in source warehouse';
  END IF;

  -- 2. Registrar movimiento de salida
  INSERT INTO public.stock_movements (
    company_id, warehouse_id, product_id, movement_type, quantity, balance_after, notes, created_by
  ) VALUES (
    _company_id, _from_warehouse_id, _product_id, 'transfer_out', -_quantity, _from_qty, _notes, _user_id
  );

  -- 3. Incrementar en el almacén destino (upsert por si no existía)
  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity)
  VALUES (_company_id, _to_warehouse_id, _product_id, _quantity)
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET quantity = public.stock_levels.quantity + _quantity,
                updated_at = now()
  RETURNING quantity INTO _to_qty;

  -- 4. Registrar movimiento de entrada
  INSERT INTO public.stock_movements (
    company_id, warehouse_id, product_id, movement_type, quantity, balance_after, notes, created_by
  ) VALUES (
    _company_id, _to_warehouse_id, _product_id, 'transfer_in', _quantity, _to_qty, _notes, _user_id
  );

  RETURN json_build_object(
    'from_warehouse_after', _from_qty,
    'to_warehouse_after', _to_qty
  );
END;
$$;
