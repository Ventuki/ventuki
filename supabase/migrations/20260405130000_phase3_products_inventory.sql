-- Fase 3: Productos e Inventario

CREATE TYPE public.inventory_movement_type AS ENUM (
  'initial',
  'purchase',
  'sale',
  'adjustment_in',
  'adjustment_out',
  'transfer_in',
  'transfer_out'
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);
CREATE INDEX idx_products_company ON public.products(company_id);
CREATE INDEX idx_products_name ON public.products(company_id, name);

CREATE TABLE public.product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, barcode)
);
CREATE INDEX idx_product_barcodes_product ON public.product_barcodes(product_id);

CREATE TABLE public.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, product_id, price_list_id)
);
CREATE INDEX idx_product_prices_product ON public.product_prices(product_id);

CREATE TABLE public.stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  max_stock NUMERIC(12,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, warehouse_id, product_id)
);
CREATE INDEX idx_stock_levels_product ON public.stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON public.stock_levels(warehouse_id);

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type public.inventory_movement_type NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  balance_after NUMERIC(12,3) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_stock_movements_company ON public.stock_movements(company_id, created_at DESC);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_prices_updated_at BEFORE UPDATE ON public.product_prices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON public.stock_levels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic stock adjustment helper
CREATE OR REPLACE FUNCTION public.adjust_stock(
  _company_id UUID,
  _warehouse_id UUID,
  _product_id UUID,
  _delta NUMERIC,
  _movement_type public.inventory_movement_type DEFAULT 'adjustment_in',
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_qty NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity)
  VALUES (_company_id, _warehouse_id, _product_id, GREATEST(_delta, 0))
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET quantity = public.stock_levels.quantity + _delta,
                updated_at = now()
  RETURNING quantity INTO _new_qty;

  IF _new_qty < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative';
  END IF;

  INSERT INTO public.stock_movements (
    company_id,
    warehouse_id,
    product_id,
    movement_type,
    quantity,
    balance_after,
    notes,
    created_by
  )
  VALUES (
    _company_id,
    _warehouse_id,
    _product_id,
    _movement_type,
    _delta,
    _new_qty,
    _notes,
    auth.uid()
  );

  RETURN json_build_object(
    'company_id', _company_id,
    'warehouse_id', _warehouse_id,
    'product_id', _product_id,
    'new_quantity', _new_qty
  );
END;
$$;

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see products of their companies" ON public.products FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage products" ON public.products FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see product_barcodes of their companies" ON public.product_barcodes FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage product_barcodes" ON public.product_barcodes FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see product_prices of their companies" ON public.product_prices FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage product_prices" ON public.product_prices FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see stock_levels of their companies" ON public.stock_levels FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage stock_levels" ON public.stock_levels FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see stock_movements of their companies" ON public.stock_movements FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Users insert stock_movements in their companies" ON public.stock_movements FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));
