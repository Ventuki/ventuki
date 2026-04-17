-- ═══════════════════════════════════════════════════════════════════════
-- FASE 8: Centralización RBAC de BD y Motor Analítico de Reportes Reales
-- ═══════════════════════════════════════════════════════════════════════

-- 1. ESTRUCTURA RBAC EN BASE DE DATOS
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE, -- ej: 'pos.create', 'inventory.transfer'
  module VARCHAR(50) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, company_id)
);

-- Poblar permisos base
INSERT INTO public.permissions (code, module, description) VALUES
('pos.create', 'pos', 'Crear ventas y procesar pagos'),
('pos.cancel', 'pos', 'Cancelar ventas'),
('pos.discount', 'pos', 'Autorizar descuentos especiales'),
('inventory.view', 'inventory', 'Ver niveles de stock'),
('inventory.adjust', 'inventory', 'Ajustar stock'),
('inventory.transfer', 'inventory', 'Transferir stock internamente'),
('purchase.create', 'purchases', 'Crear órdenes de compra'),
('purchase.receive', 'purchases', 'Recibir mercancía'),
('invoice.create', 'invoicing', 'Emitir facturas CFDI'),
('invoice.cancel', 'invoicing', 'Cancelar facturas CFDI'),
('cash.open', 'cash', 'Abrir caja'),
('cash.close', 'cash', 'Cerrar caja y hacer arqueo')
ON CONFLICT (code) DO NOTHING;

-- Función RLS: ¿Tiene permiso?
CREATE OR REPLACE FUNCTION public.has_permission(_company_id UUID, _permission_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _has BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = _company_id
      AND p.code = _permission_code
  ) INTO _has;
  RETURN _has;
END;
$$;


-- 2. REPORTES ANALÍTICOS (FIX BUG #29 - Reemplaza los datos ficticios en UI)
-- Motor de reporte diario
CREATE OR REPLACE FUNCTION public.get_daily_sales_report(
  _company_id UUID,
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  _total_sales NUMERIC;
  _total_profit NUMERIC;
  _total_items INT;
BEGIN
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No access'; END IF;

  SELECT 
    COALESCE(SUM(s.grand_total), 0),
    COALESCE(SUM(s.grand_total - (SELECT SUM(pi.quantity * pp.cost) FROM public.sale_items pi JOIN public.product_prices pp ON pp.product_id = pi.product_id WHERE pi.sale_id = s.id AND pp.company_id = _company_id)), 0),
    COALESCE(SUM((SELECT SUM(quantity) FROM public.sale_items WHERE sale_id = s.id)), 0)
  INTO _total_sales, _total_profit, _total_items
  FROM public.sales s
  WHERE s.company_id = _company_id 
    AND s.status = 'completed'
    AND s.created_at BETWEEN _start_date AND _end_date;

  RETURN json_build_object(
    'total_amount', _total_sales,
    'estimated_profit', _total_profit,
    'items_sold', _total_items,
    'date_range', json_build_array(_start_date, _end_date)
  );
END;
$$;
