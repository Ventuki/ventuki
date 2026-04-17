-- Fase 2: Catálogos Maestros

-- =============================
-- Tablas
-- =============================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_categories_company ON public.categories(company_id);

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_brands_company ON public.brands(company_id);

CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_units_company ON public.units(company_id);

CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_payment_methods_company ON public.payment_methods(company_id);

CREATE TABLE public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_price_lists_company ON public.price_lists(company_id);

CREATE TABLE public.tax_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_tax_profiles_company ON public.tax_profiles(company_id);

CREATE TABLE public.customer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_customer_types_company ON public.customer_types(company_id);

CREATE TABLE public.supplier_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);
CREATE INDEX idx_supplier_types_company ON public.supplier_types(company_id);

-- =============================
-- Triggers updated_at
-- =============================
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at BEFORE UPDATE ON public.price_lists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tax_profiles_updated_at BEFORE UPDATE ON public.tax_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_types_updated_at BEFORE UPDATE ON public.customer_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_types_updated_at BEFORE UPDATE ON public.supplier_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================
-- RLS
-- =============================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_types ENABLE ROW LEVEL SECURITY;

-- helper expression for admins/managers
-- (inline per policy for clarity)

CREATE POLICY "Users see categories of their companies" ON public.categories FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage categories" ON public.categories FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see brands of their companies" ON public.brands FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage brands" ON public.brands FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see units of their companies" ON public.units FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage units" ON public.units FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see payment_methods of their companies" ON public.payment_methods FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage payment_methods" ON public.payment_methods FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see price_lists of their companies" ON public.price_lists FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage price_lists" ON public.price_lists FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see tax_profiles of their companies" ON public.tax_profiles FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage tax_profiles" ON public.tax_profiles FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see customer_types of their companies" ON public.customer_types FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage customer_types" ON public.customer_types FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));

CREATE POLICY "Users see supplier_types of their companies" ON public.supplier_types FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers manage supplier_types" ON public.supplier_types FOR ALL TO authenticated
USING (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'))
WITH CHECK (public.is_company_admin(company_id) OR public.has_role_in_company(company_id, 'manager'));
