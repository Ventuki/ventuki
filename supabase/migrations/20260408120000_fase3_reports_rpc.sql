-- =====================================================
-- FIX FASE3-11: RPC get_daily_sales_report (no existía)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_daily_sales_report(
  _company_id UUID,
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_amount NUMERIC := 0;
  _estimated_profit NUMERIC := 0;
  _items_sold BIGINT := 0;
  _sale_count BIGINT := 0;
BEGIN
  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  SELECT
    COALESCE(SUM(total), 0),
    COUNT(*)
  INTO _total_amount, _sale_count
  FROM public.sales
  WHERE company_id = _company_id
    AND status = 'completed'
    AND completed_at >= _start_date
    AND completed_at < (_end_date + INTERVAL '1 day');

  SELECT COALESCE(SUM(quantity), 0)
  INTO _items_sold
  FROM public.sale_items si
  JOIN public.sales s ON s.id = si.sale_id
  WHERE s.company_id = _company_id
    AND s.status = 'completed'
    AND s.completed_at >= _start_date
    AND s.completed_at < (_end_date + INTERVAL '1 day');

  SELECT COALESCE(SUM(
    CASE WHEN si.tax_rate > 0 THEN
      (si.quantity * si.unit_price * (1 - si.discount_percent / 100)) - si.tax_total
    ELSE
      si.quantity * si.unit_price * (1 - si.discount_percent / 100)
    END
  ), 0)
  INTO _estimated_profit
  FROM public.sale_items si
  JOIN public.sales s ON s.id = si.sale_id
  WHERE s.company_id = _company_id
    AND s.status = 'completed'
    AND s.completed_at >= _start_date
    AND s.completed_at < (_end_date + INTERVAL '1 day');

  RETURN json_build_object(
    'total_amount', _total_amount,
    'estimated_profit', _estimated_profit,
    'items_sold', _items_sold,
    'sale_count', _sale_count,
    'date_range', json_build_array(_start_date::TEXT, _end_date::TEXT)
  );
END;
$$;