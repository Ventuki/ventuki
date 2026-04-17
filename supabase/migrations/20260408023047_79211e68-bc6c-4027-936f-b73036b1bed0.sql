
CREATE OR REPLACE FUNCTION public.process_sale_payment(_sale_id uuid, _company_id uuid, _branch_id uuid, _warehouse_id uuid, _cashier_user_id uuid, _items jsonb, _payments jsonb, _totals jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' THEN
    RAISE EXCEPTION 'La venta no está en estado draft (estado actual: %)', _sale.status;
  END IF;

  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments) p;

  _grand_total := (_totals->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
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

  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments)
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

  UPDATE public.sales SET
    subtotal = (_totals->>'subtotal')::NUMERIC,
    discount_total = (_totals->>'discount_total')::NUMERIC,
    tax_total = (_totals->>'tax_total')::NUMERIC,
    total = _grand_total,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = _sale_id;

  SELECT id INTO _active_session_id
  FROM public.cash_register_sessions
  WHERE company_id = _company_id AND branch_id = _branch_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, reference, created_by)
  VALUES (_company_id, _branch_id, _active_session_id, 'income', _grand_total, 'POS:' || _sale_id::TEXT, _cashier_user_id);

  -- Fixed: use correct audit_logs columns (user_id, entity_type, entity_id)
  INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
  VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id,
    jsonb_build_object('branch_id', _branch_id, 'warehouse_id', _warehouse_id, 'total', _grand_total));

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$function$;
