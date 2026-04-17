-- ═══════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Stock Reservation & POS Performance Optimization
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Añadir columna reserved_qty a stock_levels
ALTER TABLE public.stock_levels 
  ADD COLUMN IF NOT EXISTS reserved_qty NUMERIC(12,3) NOT NULL DEFAULT 0;

-- 2) Actualizar RPC adjust_stock para considerar reservas
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
  _reserved NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  -- Upsert stock level
  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity, reserved_qty)
  VALUES (_company_id, _warehouse_id, _product_id, GREATEST(_delta, 0), 0)
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET quantity = public.stock_levels.quantity + _delta,
                updated_at = now()
  RETURNING quantity, reserved_qty INTO _new_qty, _reserved;

  -- Validar que el stock real no baje de lo reservado
  IF _new_qty < _reserved THEN
    RAISE EXCEPTION 'No se puede ajustar el stock por debajo de la reserva actual (Q:% < R:%)', _new_qty, _reserved;
  END IF;

  -- Registrar movimiento
  INSERT INTO public.stock_movements (
    company_id, warehouse_id, product_id, movement_type, quantity, balance_after, notes, created_by
  )
  VALUES (
    _company_id, _warehouse_id, _product_id, _movement_type, _delta, _new_qty, _notes, auth.uid()
  );

  RETURN json_build_object(
    'company_id', _company_id,
    'warehouse_id', _warehouse_id,
    'product_id', _product_id,
    'new_quantity', _new_qty,
    'reserved_quantity', _reserved,
    'available_quantity', _new_qty - _reserved
  );
END;
$$;

-- 3) Crear RPC reserve_stock
CREATE OR REPLACE FUNCTION public.reserve_stock(
  _company_id UUID,
  _warehouse_id UUID,
  _product_id UUID,
  _delta_reserved NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_reserved NUMERIC;
  _current_qty NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  -- Upsert con valor inicial si no existe
  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity, reserved_qty)
  VALUES (_company_id, _warehouse_id, _product_id, 0, GREATEST(_delta_reserved, 0))
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET reserved_qty = public.stock_levels.reserved_qty + _delta_reserved,
                updated_at = now()
  RETURNING quantity, reserved_qty INTO _current_qty, _new_reserved;

  IF _new_reserved < 0 THEN
    RAISE EXCEPTION 'La reserva no puede ser negativa';
  END IF;

  IF _current_qty < _new_reserved THEN
    RAISE EXCEPTION 'Stock insuficiente para reservar (Disponible: %)', _current_qty;
  END IF;

  RETURN json_build_object(
    'product_id', _product_id,
    'new_reserved', _new_reserved,
    'total_quantity', _current_qty,
    'available', _current_qty - _new_reserved
  );
END;
$$;

-- 4) Crear RPC get_pos_products_search (OPTIMIZACIÓN BATCH)
CREATE OR REPLACE FUNCTION public.get_pos_products_search(
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _search_term TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  price NUMERIC,
  stock_total NUMERIC,
  stock_reserved NUMERIC,
  stock_available NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    COALESCE(pp.price, 0) as price,
    COALESCE(sl.quantity, 0) as stock_total,
    COALESCE(sl.reserved_qty, 0) as stock_reserved,
    COALESCE(sl.quantity, 0) - COALESCE(sl.reserved_qty, 0) as stock_available
  FROM public.products p
  -- Join con precios de la lista default
  LEFT JOIN public.product_prices pp ON pp.product_id = p.id 
    AND pp.company_id = _company_id
  LEFT JOIN public.price_lists pl ON pl.id = pp.price_list_id 
    AND pl.is_default = true
  -- Join con stock del almacén específico
  LEFT JOIN public.stock_levels sl ON sl.product_id = p.id 
    AND sl.warehouse_id = _warehouse_id
    AND sl.company_id = _company_id
  WHERE p.company_id = _company_id
    AND p.is_active = true
    AND (p.name ILIKE '%' || _search_term || '%' OR p.sku ILIKE '%' || _search_term || '%')
  ORDER BY p.name ASC
  LIMIT 50;
END;
$$;
