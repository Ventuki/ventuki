-- Compatibilidad de auditoría POS para entornos con esquema legacy de audit_logs
-- (sin branch_id/module y/o con user_id en lugar de actor_user_id).

CREATE OR REPLACE FUNCTION public.process_sale_payment(
  _sale_id UUID,
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _cashier_user_id UUID,
  _items JSONB,
  _payments JSONB,
  _totals JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
  _items_data JSONB;
  _payments_data JSONB;
  _totals_data JSONB;
  _has_branch_id BOOLEAN;
  _has_module BOOLEAN;
  _has_actor_user_id BOOLEAN;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  _items_data := _items;
  IF jsonb_typeof(_items_data) = 'string' THEN _items_data := (_items_data#>>'{}')::jsonb; END IF;

  _payments_data := _payments;
  IF jsonb_typeof(_payments_data) = 'string' THEN _payments_data := (_payments_data#>>'{}')::jsonb; END IF;

  _totals_data := _totals;
  IF jsonb_typeof(_totals_data) = 'string' THEN _totals_data := (_totals_data#>>'{}')::jsonb; END IF;

  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' AND _sale.status != 'draft_completed' THEN
    RAISE EXCEPTION 'La venta no está en estado borrador (estado actual: %)', _sale.status;
  END IF;

  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments_data) p;

  _grand_total := (_totals_data->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items_data)
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

  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments_data)
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
    subtotal = (_totals_data->>'subtotal')::NUMERIC,
    discount_total = (_totals_data->>'discount_total')::NUMERIC,
    tax_total = (_totals_data->>'tax_total')::NUMERIC,
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

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'branch_id'
  ) INTO _has_branch_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'module'
  ) INTO _has_module;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'actor_user_id'
  ) INTO _has_actor_user_id;

  IF _has_actor_user_id THEN
    IF _has_branch_id AND _has_module THEN
      INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSIF _has_branch_id THEN
      INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    ELSIF _has_module THEN
      INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSE
      INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    END IF;
  ELSE
    IF _has_branch_id AND _has_module THEN
      INSERT INTO public.audit_logs (company_id, branch_id, user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSIF _has_branch_id THEN
      INSERT INTO public.audit_logs (company_id, branch_id, user_id, action, entity_type, entity_id)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    ELSIF _has_module THEN
      INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSE
      INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    END IF;
  END IF;

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$$;
