-- ═══════════════════════════════════════════════════════════════════════
-- FASE 5: Corrección de Compras (Actualización de Costo Promedio y Clean Arch)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.receive_purchase(
  _purchase_id UUID,
  _warehouse_id UUID,
  _items JSONB,    -- [{ "purchase_item_id": uuid, "quantity_received": numeric }]
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
  _item_input JSONB;
  _pi RECORD;
  _new_received NUMERIC;
  _all_received BOOLEAN := true;
  _any_received BOOLEAN := false;

  _current_stock NUMERIC;
  _current_cost NUMERIC;
  _new_cost NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _purchase FROM public.purchases WHERE id = _purchase_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;
  IF NOT public.has_company_access(_purchase.company_id) THEN RAISE EXCEPTION 'No company access'; END IF;
  
  IF _purchase.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot receive a purchase in status: %', _purchase.status;
  END IF;

  FOR _item_input IN SELECT * FROM jsonb_array_elements(_items) LOOP
    IF (_item_input->>'quantity_received')::NUMERIC <= 0 THEN CONTINUE; END IF;

    SELECT * INTO _pi FROM public.purchase_items
    WHERE id = (_item_input->>'purchase_item_id')::UUID AND purchase_id = _purchase_id FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Purchase item not found: %', _item_input->>'purchase_item_id'; END IF;

    _new_received := _pi.received_qty + (_item_input->>'quantity_received')::NUMERIC;
    IF _new_received > _pi.quantity THEN
      RAISE EXCEPTION 'Cannot receive more than ordered for item %', _pi.id;
    END IF;

    -- Actualiza lo recibido en la línea de compra
    UPDATE public.purchase_items
    SET received_qty = _new_received, updated_at = now()
    WHERE id = _pi.id;

    -- Ajusta el inventario
    PERFORM public.adjust_stock(
      _purchase.company_id,
      _warehouse_id,
      _pi.product_id,
      (_item_input->>'quantity_received')::NUMERIC,
      'purchase',
      COALESCE(_notes, 'PO: ' || COALESCE(_purchase.folio, _purchase.id::TEXT))
    );

    -- =====================================================================
    -- BUG FIX #10: Actualizar Coste Promedio
    -- =====================================================================
    -- Obtener stock actual total en toda la empresa (sumando almacenes)
    SELECT COALESCE(SUM(quantity), 0) INTO _current_stock
    FROM public.stock_levels
    WHERE company_id = _purchase.company_id AND product_id = _pi.product_id;
    
    -- Obtener costo actual
    SELECT cost INTO _current_cost
    FROM public.product_prices
    WHERE company_id = _purchase.company_id AND product_id = _pi.product_id
    LIMIT 1;

    -- Fórmula Costo Promedio (antes de que entrará este nuevo lote):
    -- stock anterior = _current_stock - quantity_received
    -- nuevo_costo = ((stock_ant * costo_ant) + (qty_received * cost_nuevo)) / _current_stock
    IF _current_stock > 0 THEN
      _new_cost := (
        ( (_current_stock - (_item_input->>'quantity_received')::NUMERIC) * COALESCE(_current_cost, 0) ) +
        ( (_item_input->>'quantity_received')::NUMERIC * _pi.unit_cost )
      ) / _current_stock;
      
      UPDATE public.product_prices
      SET cost = _new_cost, updated_at = now()
      WHERE company_id = _purchase.company_id AND product_id = _pi.product_id;
    END IF;
    -- =====================================================================

    _any_received := true;
  END LOOP;

  -- Revisa si toda la orden se recibió completa
  FOR _pi IN SELECT * FROM public.purchase_items WHERE purchase_id = _purchase_id LOOP
    IF _pi.received_qty < _pi.quantity THEN
      _all_received := false;
      EXIT;
    END IF;
  END LOOP;

  IF _any_received THEN
    UPDATE public.purchases
    SET status = CASE WHEN _all_received THEN 'received' ELSE 'partial' END,
        updated_at = now()
    WHERE id = _purchase_id;
  END IF;

  RETURN json_build_object(
    'purchase_id', _purchase_id,
    'status', CASE WHEN _all_received THEN 'received' ELSE 'partial' END
  );
END;
$$;
