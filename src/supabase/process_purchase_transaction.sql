-- SUPABASE RPC MIGRATION: process_purchase_transaction
-- Garantiza consistencia ACID de inventario y cuentas por pagar en Compras.

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
BEGIN
  -- 0. Validar Acceso de Compañía
  v_company_id := (p_purchase_params->>'company_id')::UUID;
  IF NOT public.has_company_access(v_company_id) THEN
    RAISE EXCEPTION 'No tienes acceso a esta compañía';
  END IF;

  -- 1. Calcular Totales
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_quantity := (v_line->>'quantity')::NUMERIC;
    v_total := v_total + ((v_line->>'unit_cost')::NUMERIC * v_quantity);
  END LOOP;

  -- 2. Generar Número Consecutivo de Compra
  SELECT COALESCE(name, 'C') INTO v_branch_prefix 
  FROM branches WHERE id = (p_purchase_params->>'branch_id')::UUID AND company_id = v_company_id;
  v_purchase_number := 'COMP-' || SUBSTRING(v_branch_prefix FROM 1 FOR 3) || '-' || extract(epoch from now())::int::text;

  -- 3. Insertar Factura de Compra
  INSERT INTO purchases (
    company_id, branch_id, supplier_id, warehouse_id, 
    created_by_user_id, purchase_number, 
    subtotal, total, status, invoice_number
  ) VALUES (
    v_company_id,
    (p_purchase_params->>'branch_id')::UUID,
    (p_purchase_params->>'supplier_id')::UUID,
    (p_purchase_params->>'warehouse_id')::UUID,
    (p_purchase_params->>'user_id')::UUID,
    v_purchase_number,
    v_total, 
    v_total,
    'completed',
    NULLIF(p_purchase_params->>'invoice_number', '')::TEXT
  ) RETURNING id INTO v_purchase_id;

  -- 4. Insertar Líneas de Compra e Ingresar Inventario (purchase_items, no purchase_lines)
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines)
  LOOP
    v_product_id := (v_line->>'product_id')::UUID;
    v_quantity := (v_line->>'quantity')::NUMERIC;

    -- Registrar la línea de la orden
    INSERT INTO purchase_items (
      purchase_id, company_id, product_id, quantity, unit_cost
    ) VALUES (
      v_purchase_id,
      v_company_id,
      v_product_id,
      v_quantity,
      (v_line->>'unit_cost')::NUMERIC
    );

    -- Sumar stock al inventario (stock_levels, no inventory_stock)
    UPDATE stock_levels
    SET quantity = quantity + v_quantity,
        updated_at = NOW()
    WHERE warehouse_id = (p_purchase_params->>'warehouse_id')::UUID
      AND product_id = v_product_id
      AND company_id = v_company_id;

    -- Si no existía fila en stock, crearla
    IF NOT FOUND THEN
      INSERT INTO stock_levels (company_id, warehouse_id, product_id, quantity)
      VALUES (v_company_id, (p_purchase_params->>'warehouse_id')::UUID, v_product_id, v_quantity);
    END IF;

    -- Agregar log transaccional inmutable (stock_movements, no inventory_movements)
    INSERT INTO stock_movements (
      company_id, warehouse_id, product_id, reference_type, quantity, movement_type, notes
    ) VALUES (
      v_company_id,
      (p_purchase_params->>'warehouse_id')::UUID,
      v_product_id,
      'purchase',
      v_quantity,
      'in',
      'Ingreso de mercancía por Compra'
    );
  END LOOP;

  RETURN json_build_object('success', true, 'purchase_id', v_purchase_id, 'purchase_number', v_purchase_number)::JSONB;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Compra abortada por inconsistencia: %', SQLERRM;
END;
$$;
