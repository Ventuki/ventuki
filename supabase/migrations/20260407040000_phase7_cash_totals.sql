-- ═══════════════════════════════════════════════════════════════════════
-- FASE 6: Módulo de Caja Registradora - Totalizador de Cierre de Caja
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.calculate_cash_session_totals(_session_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_cash NUMERIC := 0;
  _total_card NUMERIC := 0;
  _total_transfer NUMERIC := 0;
  
  _opening_balance NUMERIC := 0;
  
  _company_id UUID;
BEGIN
  -- Verificar y obtener saldo inicial
  SELECT company_id, opening_balance INTO _company_id, _opening_balance
  FROM public.cash_register_sessions
  WHERE id = _session_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sesión no encontrada'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No access'; END IF;

  -- _total_cash inicia con el fondo fijo de caja
  _total_cash := _opening_balance;

  -- Calcular efectivos
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'income' OR type = 'deposit' THEN amount
      WHEN type = 'expense' OR type = 'withdrawal' THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_cash
  FROM public.cash_movements
  WHERE session_id = _session_id AND payment_method = 'cash';
  
  -- Sumar fondo fijo
  _total_cash := _total_cash + _opening_balance;

  -- Calcular tarjeta
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'income' OR type = 'deposit' THEN amount
      WHEN type = 'expense' OR type = 'withdrawal' THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_card
  FROM public.cash_movements
  WHERE session_id = _session_id AND payment_method = 'card';

  -- Calcular transferencia
  SELECT COALESCE(SUM(
    CASE 
      WHEN type = 'income' OR type = 'deposit' THEN amount
      WHEN type = 'expense' OR type = 'withdrawal' THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_transfer
  FROM public.cash_movements
  WHERE session_id = _session_id AND payment_method = 'transfer';

  RETURN json_build_object(
    'total_cash', _total_cash,
    'total_card', _total_card,
    'total_transfer', _total_transfer
  );
END;
$$;
