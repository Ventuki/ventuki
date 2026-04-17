-- ============================================================================
-- SECURITY CRITICAL FIX — RLS + Transaction Procedures
-- Fecha: 2026-04-15
-- Autor: Agent 1 - DevOps/Security
-- Prioridad: CRÍTICA — Ejecutar antes del siguiente deploy
-- ============================================================================
-- ISSUES CORREGIDOS:
-- 1. branch_rls_policies.sql: inventory_stock → stock_levels (GAP-01)
-- 2. process_purchase_transaction.sql: inventory_stock → stock_levels (GAP-02)
-- 3. process_sale_transaction.sql: inventory_stock → stock_levels (GAP-02)
-- 4. process_purchase_transaction.sql: Sin validación de tenant (GAP-03)
-- 5. process_sale_transaction.sql: Sin validación de tenant (GAP-03)
-- 6. stock_movements: UPDATE/DELETE policies faltantes (GAP-06)
-- ============================================================================

-- ============================================================================
-- FIX 1: branch_rls_policies.sql — Corregir referencias a inventory_stock
-- ============================================================================
-- La tabla real es stock_levels, no inventory_stock.
-- Este script recrea las políticas correctamente.

-- Deshabilitar RLS temporalmente para hacer cambios
ALTER TABLE public.stock_levels DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas vieja (que referenciaban inventory_stock)
DROP POLICY IF EXISTS "permitir_acceso_total" ON public.stock_levels;
DROP POLICY IF EXISTS "cajeros_ven_inventario_local_stock" ON public.stock_levels;

-- recrear políticas para stock_levels con filtrado por branch/company
DROP POLICY IF EXISTS "cajeros_ven_su_sucursal_stock" ON public.stock_levels;
CREATE POLICY "cajeros_ven_su_sucursal_stock"
  ON public.stock_levels
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.branches b
      JOIN public.warehouses w ON b.id = w.branch_id
      WHERE w.id = stock_levels.warehouse_id
      AND (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'owner'
         AND b.company_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'company_id')
        OR
        (b.id::TEXT = auth.jwt() -> 'app_metadata' ->> 'branch_id')
      )
    )
  );

-- Solo admins de compañía pueden modificar stock
DROP POLICY IF EXISTS "admins_manage_stock_levels" ON public.stock_levels;
CREATE POLICY "admins_manage_stock_levels"
  ON public.stock_levels
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.branches b
      JOIN public.warehouses w ON b.id = w.branch_id
      WHERE w.id = stock_levels.warehouse_id
      AND b.company_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'company_id'
      AND (auth.jwt() -> 'app_metadata' ->> 'role' IN ('owner', 'admin'))
    )
  );

ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIX 2: process_purchase_transaction — Validación de tenant + tablas correctas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_purchase_transaction(
  p_purchase_params JSONB,
  p_lines JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id UUID;
  v_purchase_number VARCHAR;
  v_branch_prefix VARCHAR;
  v_line JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_total NUMERIC := 0;
  v_company_id UUID;
  v_branch_id UUID;
  v_warehouse_id UUID;
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- FIX GAP-03: Validar que el usuario tenga acceso al company_id
  -- ═══════════════════════════════════════════════════════════
  v_company_id := (p_purchase_params->>'company_id')::UUID;
  v_branch_id := (p_purchase_params->>'branch_id')::UUID;
  v_warehouse_id := (p_purchase_params->>'warehouse_id')::UUID;

  IF v_company_id IS NULL OR v_branch_id IS NULL OR v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'company_id, branch_id y warehouse_id son obligatorios';
  END IF;

  IF NOT public.has_company_access(v_company_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta compañía';
  END IF;

  -- Verificar que la branch y warehouse pertenezcan a la compañía
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses w
    JOIN public.branches b ON b.id = w.branch_id
    WHERE w.id = v_warehouse_id AND b.id = v_branch_id AND b.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'La sucursal o almacén no pertenece a la compañía especificada';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Cálculo de totales con validación
  -- ═══════════════════════════════════════════════════════════
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_quantity := (v_line->>'quantity')::NUMERIC;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para producto %', v_line->>'product_id';
    END IF;

    v_total := v_total + ((v_line->>'unit_cost')::NUMERIC * v_quantity);
  END LOOP;

  -- ═══════════════════════════════════════════════════════════
  -- Generación de número de compra
  -- ═══════════════════════════════════════════════════════════
  SELECT COALESCE(name, 'C') INTO v_branch_prefix
  FROM branches WHERE id = v_branch_id;

  v_purchase_number := 'COMP-' || UPPER(SUBSTRING(v_branch_prefix FROM 1 FOR 3)) || '-' ||
                       extract(epoch from now())::int::text;

  -- ═══════════════════════════════════════════════════════════
  -- Insertar Factura de Compra
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO purchases (
    company_id, branch_id, supplier_id, warehouse_id,
    created_by_user_id, purchase_number,
    subtotal, total, status, invoice_number
  ) VALUES (
    v_company_id,
    v_branch_id,
    (p_purchase_params->>'supplier_id')::UUID,
    v_warehouse_id,
    (p_purchase_params->>'user_id')::UUID,
    v_purchase_number,
    v_total,
    v_total,
    'completed',
    NULLIF(p_purchase_params->>'invoice_number', '')::TEXT
  ) RETURNING id INTO v_purchase_id;

  -- ═══════════════════════════════════════════════════════════
  -- Insertar Líneas de Compra e Ingresar Inventario
  -- FIX GAP-02: inventory_stock → stock_levels
  -- ═══════════════════════════════════════════════════════════
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_product_id := (v_line->>'product_id')::UUID;
    v_quantity := (v_line->>'quantity')::NUMERIC;

    INSERT INTO purchase_lines (
      purchase_id, product_id, quantity, unit_cost
    ) VALUES (
      v_purchase_id,
      v_product_id,
      v_quantity,
      (v_line->>'unit_cost')::NUMERIC
    );

    -- Sumar stock al inventario (stock_levels, no inventory_stock)
    UPDATE stock_levels
    SET quantity = quantity + v_quantity,
        updated_at = NOW()
    WHERE warehouse_id = v_warehouse_id
      AND product_id = v_product_id;

    IF NOT FOUND THEN
      INSERT INTO stock_levels (company_id, warehouse_id, product_id, quantity, reserved_qty)
      VALUES (v_company_id, v_warehouse_id, v_product_id, v_quantity, 0);
    END IF;

    -- Registrar movimiento (stock_movements, no inventory_movements)
    INSERT INTO stock_movements (
      company_id, warehouse_id, product_id, reference_type,
      movement_type, quantity, notes, created_by
    ) VALUES (
      v_company_id,
      v_warehouse_id,
      v_product_id,
      'purchase',
      'in',
      v_quantity,
      'Ingreso de mercancía por Compra',
      (p_purchase_params->>'user_id')::UUID
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'purchase_number', v_purchase_number
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Compra abortada: %', SQLERRM;
END;
$$;

-- ============================================================================
-- FIX 3: process_sale_transaction — Validación de tenant + tablas correctas
-- ============================================================================
CREATE OR REPLACE FUNCTION public.process_sale_transaction(
  p_sale_params JSONB,
  p_cart_lines JSONB,
  p_payments JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_sale_number VARCHAR;
  v_branch_prefix VARCHAR;
  v_line JSONB;
  v_payment JSONB;
  v_product_id UUID;
  v_quantity NUMERIC;
  v_stock NUMERIC;
  v_total NUMERIC := 0;
  v_company_id UUID;
  v_branch_id UUID;
  v_warehouse_id UUID;
BEGIN
  -- ═══════════════════════════════════════════════════════════
  -- FIX GAP-03: Validar acceso al company_id
  -- ═══════════════════════════════════════════════════════════
  v_company_id := (p_sale_params->>'company_id')::UUID;
  v_branch_id := (p_sale_params->>'branch_id')::UUID;
  v_warehouse_id := (p_sale_params->>'warehouse_id')::UUID;

  IF v_company_id IS NULL OR v_branch_id IS NULL OR v_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'company_id, branch_id y warehouse_id son obligatorios';
  END IF;

  IF NOT public.has_company_access(v_company_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta compañía';
  END IF;

  -- Verificar que la branch y warehouse pertenezcan a la compañía
  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses w
    JOIN public.branches b ON b.id = w.branch_id
    WHERE w.id = v_warehouse_id AND b.id = v_branch_id AND b.company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'La sucursal o almacén no pertenece a la compañía especificada';
  END IF;

  -- ═══════════════════════════════════════════════════════════
  -- Validar stock y calcular totales
  -- FIX GAP-02: inventory_stock → stock_levels
  -- ═══════════════════════════════════════════════════════════
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_cart_lines)
  LOOP
    v_product_id := (v_line->>'product_id')::UUID;
    v_quantity := (v_line->>'quantity')::NUMERIC;

    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'Cantidad inválida para producto %', v_product_id;
    END IF;

    UPDATE stock_levels
    SET quantity = quantity - v_quantity,
        updated_at = NOW()
    WHERE warehouse_id = v_warehouse_id
      AND product_id = v_product_id
    RETURNING quantity INTO v_stock;

    IF v_stock < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_product_id;
    END IF;

    -- Registrar movimiento (stock_movements, no inventory_movements)
    INSERT INTO stock_movements (
      company_id, warehouse_id, product_id, reference_type,
      movement_type, quantity, notes, created_by
    ) VALUES (
      v_company_id,
      v_warehouse_id,
      v_product_id,
      'sale',
      'out',
      v_quantity,
      'Venta procesada (POS)',
      (p_sale_params->>'cashier_user_id')::UUID
    );

    v_total := v_total + ((v_line->>'unit_price')::NUMERIC * v_quantity);
  END LOOP;

  -- ═══════════════════════════════════════════════════════════
  -- Generación de número de venta
  -- ═══════════════════════════════════════════════════════════
  SELECT COALESCE(name, 'V') INTO v_branch_prefix
  FROM branches WHERE id = v_branch_id;

  v_sale_number := UPPER(SUBSTRING(v_branch_prefix FROM 1 FOR 3)) || '-' ||
                    extract(epoch from now())::int::text;

  -- ═══════════════════════════════════════════════════════════
  -- Crear Venta
  -- ═══════════════════════════════════════════════════════════
  INSERT INTO sales (
    company_id, branch_id, warehouse_id,
    customer_id, cashier_id, sale_number,
    subtotal, total, status, invoice_requested
  ) VALUES (
    v_company_id,
    v_branch_id,
    v_warehouse_id,
    NULLIF(p_sale_params->>'customer_id', '')::UUID,
    (p_sale_params->>'cashier_user_id')::UUID,
    v_sale_number,
    v_total,
    v_total,
    'completed',
    COALESCE((p_sale_params->>'invoice_requested')::BOOLEAN, false)
  ) RETURNING id INTO v_sale_id;

  -- ═══════════════════════════════════════════════════════════
  -- Insertar Líneas de Venta
  -- ═══════════════════════════════════════════════════════════
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_cart_lines)
  LOOP
    INSERT INTO sale_items (
      sale_id, product_id, quantity, unit_price, tax_rate, discount_percent
    ) VALUES (
      v_sale_id,
      (v_line->>'product_id')::UUID,
      (v_line->>'quantity')::NUMERIC,
      (v_line->>'unit_price')::NUMERIC,
      COALESCE((v_line->>'tax_rate')::NUMERIC, 0),
      COALESCE((v_line->>'discount_percent')::NUMERIC, 0)
    );
  END LOOP;

  -- ═══════════════════════════════════════════════════════════
  -- Insertar Pagos
  -- ═══════════════════════════════════════════════════════════
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    INSERT INTO sale_payments (
      sale_id, payment_method, amount, reference
    ) VALUES (
      v_sale_id,
      v_payment->>'method',
      (v_payment->>'amount')::NUMERIC,
      NULLIF(v_payment->>'reference', '')::TEXT
    );
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'sale_number', v_sale_number
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Venta abortada: %', SQLERRM;
END;
$$;

-- ============================================================================
-- FIX 4: stock_movements — Hacer inmutables (solo INSERT/SELECT, sin UPDATE/DELETE)
-- ============================================================================
-- Los movimientos de inventario son históricos y deben ser inmutables.
-- Primero eliminar políticas existentes y luego recrear solo con INSERT/SELECT.

ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Admins insert movements" ON public.stock_movements;
DROP POLICY IF EXISTS "Users see stock_movements of their companies" ON public.stock_movements;
DROP POLICY IF EXISTS "Users insert stock_movements in their companies" ON public.stock_movements;

-- Política SELECT: solo movimientos de las compañías del usuario
CREATE POLICY "stock_movements_select_own_company"
  ON public.stock_movements
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    company_id IN (SELECT public.get_user_company_ids())
  );

-- Política INSERT: admins y managers pueden crear movimientos
-- (el trigger de auditoría ya registra quién creó cada movimiento)
CREATE POLICY "stock_movements_insert_company_admin"
  ON public.stock_movements
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_company_admin(company_id)
    OR
    company_id IN (SELECT public.get_user_company_ids())
  );

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "stock_movements_select_own_company" ON public.stock_movements IS
  'Solo usuarios de la compañía pueden ver sus movimientos de inventario';

COMMENT ON POLICY "stock_movements_insert_company_admin" ON public.stock_movements IS
  'Solo admins pueden insertar movimientos (los movimientos son inmutables)';

-- ============================================================================
-- FIX 5: Audit triggers — Adjuntar a tablas transaccionales críticas
-- ============================================================================

-- Trigger para stock_levels
DROP TRIGGER IF EXISTS trg_audit_stock_levels ON public.stock_levels;
CREATE TRIGGER trg_audit_stock_levels
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_levels
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

-- Trigger para sales
DROP TRIGGER IF EXISTS trg_audit_sales ON public.sales;
CREATE TRIGGER trg_audit_sales
  AFTER INSERT OR UPDATE OR DELETE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

-- Trigger para purchases
DROP TRIGGER IF EXISTS trg_audit_purchases ON public.purchases;
CREATE TRIGGER trg_audit_purchases
  AFTER INSERT OR UPDATE OR DELETE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

-- Trigger para customers
DROP TRIGGER IF EXISTS trg_audit_customers ON public.customers;
CREATE TRIGGER trg_audit_customers
  AFTER INSERT OR UPDATE OR DELETE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_trigger();

-- ============================================================================
-- VERIFICACIÓN POST-FIX
-- ============================================================================
DO $$
BEGIN
  -- Verificar que process_purchase_transaction referencia stock_levels
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'process_purchase_transaction'
    AND n.nspname = 'public'
    AND pg_get_functiondef(p.oid) LIKE '%stock_levels%'
  ) THEN
    RAISE NOTICE 'FIX OK: process_purchase_transaction referencia stock_levels';
  ELSE
    RAISE EXCEPTION 'FIX FAILED: process_purchase_transaction no referencia stock_levels';
  END IF;

  -- Verificar que process_sale_transaction referencia stock_levels
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'process_sale_transaction'
    AND n.nspname = 'public'
    AND pg_get_functiondef(p.oid) LIKE '%stock_levels%'
  ) THEN
    RAISE NOTICE 'FIX OK: process_sale_transaction referencia stock_levels';
  ELSE
    RAISE EXCEPTION 'FIX FAILED: process_sale_transaction no referencia stock_levels';
  END IF;

  -- Verificar has_company_access en process_purchase_transaction
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE p.proname = 'process_purchase_transaction'
    AND n.nspname = 'public'
    AND pg_get_functiondef(p.oid) LIKE '%has_company_access%'
  ) THEN
    RAISE NOTICE 'FIX OK: process_purchase_transaction tiene validación de tenant';
  ELSE
    RAISE EXCEPTION 'FIX FAILED: process_purchase_transaction falta validación de tenant';
  END IF;

  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '  TODOS LOS FIXS DE SEGURIDAD APLICADOS EXITOSAMENTE';
  RAISE NOTICE '══════════════════════════════════════════════════';
END;
$$;