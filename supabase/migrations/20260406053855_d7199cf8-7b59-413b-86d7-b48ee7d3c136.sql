
-- Categories
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company categories" ON public.categories FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Brands
CREATE TABLE public.brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company brands" ON public.brands FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert brands" ON public.brands FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update brands" ON public.brands FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete brands" ON public.brands FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Units
CREATE TABLE public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company units" ON public.units FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert units" ON public.units FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update units" ON public.units FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete units" ON public.units FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Price Lists
CREATE TABLE public.price_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company price_lists" ON public.price_lists FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert price_lists" ON public.price_lists FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update price_lists" ON public.price_lists FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete price_lists" ON public.price_lists FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  sku text NOT NULL,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES public.categories(id),
  brand_id uuid REFERENCES public.brands(id),
  unit_id uuid REFERENCES public.units(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company products" ON public.products FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update products" ON public.products FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete products" ON public.products FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Product Barcodes
CREATE TABLE public.product_barcodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  barcode text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, barcode)
);
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company barcodes" ON public.product_barcodes FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert barcodes" ON public.product_barcodes FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update barcodes" ON public.product_barcodes FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete barcodes" ON public.product_barcodes FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Product Prices
CREATE TABLE public.product_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price_list_id uuid NOT NULL REFERENCES public.price_lists(id),
  price numeric(12,4) NOT NULL DEFAULT 0,
  cost numeric(12,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, price_list_id)
);
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company prices" ON public.product_prices FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert prices" ON public.product_prices FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update prices" ON public.product_prices FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete prices" ON public.product_prices FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  supplier_type_id uuid,
  code text,
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  tax_id text,
  address text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company suppliers" ON public.suppliers FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert suppliers" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update suppliers" ON public.suppliers FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete suppliers" ON public.suppliers FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Stock Levels
CREATE TABLE public.stock_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric(12,3) NOT NULL DEFAULT 0,
  min_stock numeric(12,3) NOT NULL DEFAULT 0,
  max_stock numeric(12,3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(warehouse_id, product_id)
);
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company stock" ON public.stock_levels FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert stock" ON public.stock_levels FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update stock" ON public.stock_levels FOR UPDATE TO authenticated USING (is_company_admin(company_id));

-- Stock Movements
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id),
  product_id uuid NOT NULL REFERENCES public.products(id),
  movement_type text NOT NULL,
  quantity numeric(12,3) NOT NULL,
  reference_id uuid,
  notes text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company movements" ON public.stock_movements FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));

-- adjust_stock function
CREATE OR REPLACE FUNCTION public.adjust_stock(
  _company_id uuid,
  _warehouse_id uuid,
  _product_id uuid,
  _delta numeric,
  _movement_type text,
  _notes text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO stock_levels (company_id, warehouse_id, product_id, quantity)
  VALUES (_company_id, _warehouse_id, _product_id, GREATEST(_delta, 0))
  ON CONFLICT (warehouse_id, product_id)
  DO UPDATE SET quantity = stock_levels.quantity + _delta, updated_at = now();

  INSERT INTO stock_movements (company_id, warehouse_id, product_id, movement_type, quantity, notes, user_id)
  VALUES (_company_id, _warehouse_id, _product_id, _movement_type, _delta, _notes, auth.uid());
END;
$$;

-- Catalog tables for settings page
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company payment_methods" ON public.payment_methods FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert payment_methods" ON public.payment_methods FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update payment_methods" ON public.payment_methods FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete payment_methods" ON public.payment_methods FOR DELETE TO authenticated USING (is_company_admin(company_id));

CREATE TABLE public.tax_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  tax_rate numeric(6,4) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company tax_profiles" ON public.tax_profiles FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert tax_profiles" ON public.tax_profiles FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update tax_profiles" ON public.tax_profiles FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete tax_profiles" ON public.tax_profiles FOR DELETE TO authenticated USING (is_company_admin(company_id));

CREATE TABLE public.customer_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company customer_types" ON public.customer_types FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert customer_types" ON public.customer_types FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update customer_types" ON public.customer_types FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete customer_types" ON public.customer_types FOR DELETE TO authenticated USING (is_company_admin(company_id));

CREATE TABLE public.supplier_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  code text,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company supplier_types" ON public.supplier_types FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert supplier_types" ON public.supplier_types FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update supplier_types" ON public.supplier_types FOR UPDATE TO authenticated USING (is_company_admin(company_id));
CREATE POLICY "Admins delete supplier_types" ON public.supplier_types FOR DELETE TO authenticated USING (is_company_admin(company_id));

-- Purchases
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  folio text,
  status text NOT NULL DEFAULT 'draft',
  total numeric(14,4) NOT NULL DEFAULT 0,
  expected_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own company purchases" ON public.purchases FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Admins insert purchases" ON public.purchases FOR INSERT TO authenticated WITH CHECK (is_company_admin(company_id));
CREATE POLICY "Admins update purchases" ON public.purchases FOR UPDATE TO authenticated USING (is_company_admin(company_id));

-- Purchase Items
CREATE TABLE public.purchase_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id),
  quantity numeric(12,3) NOT NULL DEFAULT 0,
  received_qty numeric(12,3) NOT NULL DEFAULT 0,
  unit_cost numeric(12,4) NOT NULL DEFAULT 0,
  tax_rate numeric(6,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see purchase items" ON public.purchase_items FOR SELECT TO authenticated
  USING (purchase_id IN (SELECT id FROM public.purchases WHERE company_id IN (SELECT get_user_company_ids())));
CREATE POLICY "Admins insert purchase items" ON public.purchase_items FOR INSERT TO authenticated
  WITH CHECK (purchase_id IN (SELECT id FROM public.purchases WHERE company_id IN (SELECT get_user_company_ids())));
CREATE POLICY "Admins update purchase items" ON public.purchase_items FOR UPDATE TO authenticated
  USING (purchase_id IN (SELECT id FROM public.purchases WHERE company_id IN (SELECT get_user_company_ids())));
