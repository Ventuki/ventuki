-- SUPABASE RPC MIGRATION: process_sale_transaction
-- Este script crea una función en la Base de Datos que procesa la venta, inventario y cobro de manera ACID.

CREATE OR REPLACE FUNCTION public.process_sale_transaction(
  p_sale_params JSONB,
  p_cart_lines JSONB,
  p_payments JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Se ejecuta con privilegios del creador para asegurar que las inserciones pasen
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
  v_warehouse_id UUID;
  v_company_id UUID;
BEGIN
  -- 0. Validar Acceso de Compañía
  v_company_id := (p_sale_params->>'company_id')::UUID;
  IF NOT public.has_company_access(v_company_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta compañía';
  END IF;

  -- 1. Validar Stock y Calcular Totales (Bloqueo Pesimista opcional FOR UPDATE)
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_cart_lines)
  LOOP
    v_product_id := (v_line->>'product_id')::UUID;
    v_quantity := (v_line->>'quantity')::NUMERIC;
    
    -- Restar stock del inventario (stock_levels, no inventory_stock)
    UPDATE stock_levels
    SET quantity = quantity - v_quantity,
        updated_at = NOW()
    WHERE warehouse_id = (p_sale_params->>'warehouse_id')::UUID
      AND product_id = v_product_id
      AND company_id = v_company_id
    RETURNING quantity INTO v_stock;

    IF v_stock < 0 THEN
      RAISE EXCEPTION 'Stock insuficiente para el producto %', v_product_id;
    END IF;

    -- Agregar log transaccional (stock_movements, no inventory_movements)
    INSERT INTO stock_movements (
      company_id, warehouse_id, product_id, reference_type, quantity, movement_type, notes
    ) VALUES (
      v_company_id,
      (p_sale_params->>'warehouse_id')::UUID,
      v_product_id,
      'sale',
      v_quantity,
      'out',
      'Venta procesada (POS)'
    );

    v_total := v_total + ((v_line->>'unit_price')::NUMERIC * v_quantity);
  END LOOP;

  -- 2. Generar Número Consecutivo de Venta
  SELECT COALESCE(name, 'V') INTO v_branch_prefix 
  FROM branches WHERE id = (p_sale_params->>'branch_id')::UUID AND company_id = v_company_id;
  
  -- Generación simplificada (ideamente se usa una secuencia por sucursal)
  v_sale_number := SUBSTRING(v_branch_prefix FROM 1 FOR 3) || '-' || extract(epoch from now())::int::text;

  -- 3. Crear Venta
  INSERT INTO sales (
    company_id, branch_id, warehouse_id, 
    customer_id, cashier_user_id, sale_number, 
    subtotal, total, status, invoice_requested
  ) VALUES (
    v_company_id,
    (p_sale_params->>'branch_id')::UUID,
    (p_sale_params->>'warehouse_id')::UUID,
    NULLIF(p_sale_params->>'customer_id', '')::UUID,
    (p_sale_params->>'cashier_user_id')::UUID,
    v_sale_number,
    v_total, 
    v_total, -- Agrega calculos de impuestos fijos aquí si es necesario
    'completed',
    COALESCE((p_sale_params->>'invoice_requested')::BOOLEAN, false)
  ) RETURNING id INTO v_sale_id;

  -- 4. Insertar Lineas de Venta (sale_items, no sale_lines)
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_cart_lines)
  LOOP
    INSERT INTO sale_items (
      sale_id, company_id, product_id, quantity, unit_price, tax_rate, discount_percent, product_name, sku, subtotal, total
    ) VALUES (
      v_sale_id,
      v_company_id,
      (v_line->>'product_id')::UUID,
      (v_line->>'quantity')::NUMERIC,
      (v_line->>'unit_price')::NUMERIC,
      COALESCE((v_line->>'tax_rate')::NUMERIC, 0.16),
      COALESCE((v_line->>'discount_percent')::NUMERIC, 0),
      COALESCE(v_line->>'product_name', 'Producto'),
      COALESCE(v_line->>'sku', 'S/N'),
      ((v_line->>'unit_price')::NUMERIC * (v_line->>'quantity')::NUMERIC),
      ((v_line->>'unit_price')::NUMERIC * (v_line->>'quantity')::NUMERIC)
    );
  END LOOP;

  -- 5. Insertar Pagos
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
    INSERT INTO sale_payments (
      sale_id, company_id, branch_id, warehouse_id, method, amount, reference
    ) VALUES (
      v_sale_id,
      v_company_id,
      (p_sale_params->>'branch_id')::UUID,
      (p_sale_params->>'warehouse_id')::UUID,
      v_payment->>'method',
      (v_payment->>'amount')::NUMERIC,
      NULLIF(v_payment->>'reference', '')
    );
  END LOOP;

  RETURN json_build_object('success', true, 'sale_id', v_sale_id, 'sale_number', v_sale_number)::JSONB;
  
EXCEPTION WHEN OTHERS THEN
  -- Todo cambio realizado se revierte automáticamente gracias a la transaccionalidad de Postgres Functions.
  RAISE EXCEPTION 'Venta abortada preventivamente: %', SQLERRM;
END;
$$;
