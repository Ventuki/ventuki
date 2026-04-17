-- SUPABASE ROW LEVEL SECURITY (RLS) PARA MÚLTIPLES SUCURSALES
-- Evita accesos horizontales no autorizados asumiendo que los claims JWT existen.

-- 1. Habilitar RLS en tablas críticas
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas base vulnerables (si existieran)
DROP POLICY IF EXISTS "permitir_acceso_total" ON public.sales;
DROP POLICY IF EXISTS "permitir_acceso_total" ON public.purchases;
DROP POLICY IF EXISTS "permitir_acceso_total" ON public.stock_levels;

-- 3. Crear Políticas robustas basadas en los Custom Claims de App Metadata de Auth
-- Presupone que al iniciar sesión, se le setea al usuario su company_id y branch_id en app_metadata

CREATE POLICY "cajeros_solo_ven_su_sucursal_ventas"
ON public.sales
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Los Owners o Admins de compañia pueden ver todas sus sucursales
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'owner' AND company_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'company_id')
  OR 
  -- Los Cajeros solo pueden ver transacciones de su sucursal autorizada
  (branch_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'branch_id')
);

CREATE POLICY "cajeros_solo_ven_su_sucursal_compras"
ON public.purchases
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'owner' AND company_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'company_id')
  OR 
  (branch_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'branch_id')
);

CREATE POLICY "cajeros_ven_inventario_local_stock"
ON public.stock_levels
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  -- Inventario filtra típicamente por Warehouse, requerirá cruzar via WHERE sobre branches
  EXISTS (
    SELECT 1 FROM public.branches b 
    JOIN public.warehouses w ON b.id = w.branch_id
    WHERE w.id = stock_levels.warehouse_id
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role' = 'owner' AND b.company_id::TEXT = auth.jwt() -> 'app_metadata' ->> 'company_id')
      OR
      (b.id::TEXT = auth.jwt() -> 'app_metadata' ->> 'branch_id')
    )
  )
);
