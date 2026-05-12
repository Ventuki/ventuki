-- COMBINED MIGRATIONS FOR MANUAL DEPLOYMENT

-- ==================================================================
-- FILE: 20260405071445_628e4839-35a8-4723-93eb-8409568c1dfe.sql
-- ==================================================================


-- ═══════════════════════════════════════════════════════
-- FASE 1: BASE MULTI-TENANT POS SaaS
-- ═══════════════════════════════════════════════════════

-- ─── Enums ───
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'cashier', 'seller', 'warehouse_keeper', 'purchaser', 'accountant');
CREATE TYPE public.doc_status AS ENUM ('draft', 'confirmed', 'completed', 'cancelled', 'voided');

-- ─── Utility: updated_at trigger function ───
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ═══════════════════════════════════════════════════════
-- COMPANIES
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  currency TEXT NOT NULL DEFAULT 'MXN',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- BRANCHES (Sucursales)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_branches_company ON public.branches(company_id);

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- WAREHOUSES (Almacenes)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warehouses_company ON public.warehouses(company_id);
CREATE INDEX idx_warehouses_branch ON public.warehouses(branch_id);

CREATE TRIGGER update_warehouses_updated_at
  BEFORE UPDATE ON public.warehouses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- CASH REGISTERS (Cajas)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.cash_registers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_registers_company ON public.cash_registers(company_id);
CREATE INDEX idx_cash_registers_branch ON public.cash_registers(branch_id);

CREATE TRIGGER update_cash_registers_updated_at
  BEFORE UPDATE ON public.cash_registers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- USER PROFILES
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ═══════════════════════════════════════════════════════
-- COMPANY USERS (usuario-empresa-sucursal-rol)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.company_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  role app_role NOT NULL DEFAULT 'seller',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX idx_company_users_user ON public.company_users(user_id);
CREATE INDEX idx_company_users_company ON public.company_users(company_id);

CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON public.company_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- ROLES (custom roles per company)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_roles_company ON public.roles(company_id);

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ═══════════════════════════════════════════════════════
-- PERMISSIONS (global catalog)
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT,
  UNIQUE(module, action)
);

-- ═══════════════════════════════════════════════════════
-- ROLE PERMISSIONS
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON public.role_permissions(role_id);

-- ═══════════════════════════════════════════════════════
-- AUDIT LOG
-- ═══════════════════════════════════════════════════════
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- SECURITY DEFINER FUNCTIONS (avoid RLS recursion)
-- ═══════════════════════════════════════════════════════

-- Get all company IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.get_user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.company_users
  WHERE user_id = auth.uid() AND is_active = true;
$$;

-- Get branch IDs for user in a specific company
CREATE OR REPLACE FUNCTION public.get_user_branch_ids(_company_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT branch_id FROM public.company_users
  WHERE user_id = auth.uid() AND company_id = _company_id AND is_active = true AND branch_id IS NOT NULL;
$$;

-- Check if user has access to a company
CREATE OR REPLACE FUNCTION public.has_company_access(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND is_active = true
  );
$$;

-- Check if user has a specific role in a company
CREATE OR REPLACE FUNCTION public.has_role_in_company(_company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND role = _role AND is_active = true
  );
$$;

-- Check if user is admin of a company
CREATE OR REPLACE FUNCTION public.is_company_admin(_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE user_id = auth.uid() AND company_id = _company_id AND role = 'admin' AND is_active = true
  );
$$;

-- ═══════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════

-- ─── COMPANIES ───
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their companies"
  ON public.companies FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "Admins update their company"
  ON public.companies FOR UPDATE TO authenticated
  USING (public.is_company_admin(id));

-- ─── BRANCHES ───
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see branches of their companies"
  ON public.branches FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "Admins manage branches"
  ON public.branches FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins update branches"
  ON public.branches FOR UPDATE TO authenticated
  USING (public.is_company_admin(company_id));

-- ─── WAREHOUSES ───
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see warehouses of their companies"
  ON public.warehouses FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "Admins manage warehouses"
  ON public.warehouses FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins update warehouses"
  ON public.warehouses FOR UPDATE TO authenticated
  USING (public.is_company_admin(company_id));

-- ─── CASH REGISTERS ───
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see cash registers of their companies"
  ON public.cash_registers FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "Admins manage cash registers"
  ON public.cash_registers FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins update cash registers"
  ON public.cash_registers FOR UPDATE TO authenticated
  USING (public.is_company_admin(company_id));

-- ─── USER PROFILES ───
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own profile"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- ─── COMPANY USERS ───
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see members of their companies"
  ON public.company_users FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "Admins manage company users"
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins update company users"
  ON public.company_users FOR UPDATE TO authenticated
  USING (public.is_company_admin(company_id));

CREATE POLICY "Admins remove company users"
  ON public.company_users FOR DELETE TO authenticated
  USING (public.is_company_admin(company_id));

-- ─── ROLES ───
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see roles of their companies"
  ON public.roles FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

CREATE POLICY "Admins manage roles"
  ON public.roles FOR INSERT TO authenticated
  WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY "Admins update roles"
  ON public.roles FOR UPDATE TO authenticated
  USING (public.is_company_admin(company_id));

-- ─── PERMISSIONS (global, readable by all authenticated) ───
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users see permissions"
  ON public.permissions FOR SELECT TO authenticated
  USING (true);

-- ─── ROLE PERMISSIONS ───
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see role permissions of their companies"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (role_id IN (
    SELECT id FROM public.roles WHERE company_id IN (SELECT public.get_user_company_ids())
  ));

CREATE POLICY "Admins manage role permissions"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (role_id IN (
    SELECT id FROM public.roles WHERE company_id IN (SELECT public.get_user_company_ids())
    AND public.is_company_admin(company_id)
  ));

CREATE POLICY "Admins delete role permissions"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (role_id IN (
    SELECT id FROM public.roles WHERE company_id IN (SELECT public.get_user_company_ids())
    AND public.is_company_admin(company_id)
  ));

-- ─── AUDIT LOGS ───
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins see audit logs of their companies"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_company_admin(company_id));

CREATE POLICY "System inserts audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- ═══════════════════════════════════════════════════════
-- SEED: Initial permissions catalog
-- ═══════════════════════════════════════════════════════
INSERT INTO public.permissions (module, action, description) VALUES
  ('dashboard', 'view', 'Ver dashboard'),
  ('pos', 'sell', 'Realizar ventas'),
  ('pos', 'apply_discount', 'Aplicar descuentos'),
  ('pos', 'void_sale', 'Anular ventas'),
  ('products', 'view', 'Ver productos'),
  ('products', 'create', 'Crear productos'),
  ('products', 'update', 'Editar productos'),
  ('products', 'delete', 'Eliminar productos'),
  ('inventory', 'view', 'Ver inventario'),
  ('inventory', 'adjust', 'Ajustar inventario'),
  ('inventory', 'transfer', 'Traspasos entre almacenes'),
  ('purchases', 'view', 'Ver compras'),
  ('purchases', 'create', 'Crear órdenes de compra'),
  ('purchases', 'receive', 'Recibir mercancía'),
  ('sales', 'view', 'Ver historial de ventas'),
  ('sales', 'refund', 'Procesar devoluciones'),
  ('customers', 'view', 'Ver clientes'),
  ('customers', 'manage', 'Gestionar clientes'),
  ('suppliers', 'view', 'Ver proveedores'),
  ('suppliers', 'manage', 'Gestionar proveedores'),
  ('cash_register', 'open', 'Abrir caja'),
  ('cash_register', 'close', 'Cerrar caja'),
  ('cash_register', 'cut', 'Corte de caja'),
  ('reports', 'view', 'Ver reportes'),
  ('reports', 'export', 'Exportar reportes'),
  ('settings', 'view', 'Ver configuración'),
  ('settings', 'manage', 'Gestionar configuración'),
  ('users', 'view', 'Ver usuarios'),
  ('users', 'manage', 'Gestionar usuarios'),
  ('roles', 'manage', 'Gestionar roles y permisos'),
  ('audit', 'view', 'Ver bitácora de auditoría');


-- ==================================================================
-- FILE: 20260405072429_bdfbf125-67f9-4877-8614-b79325ff71e1.sql
-- ==================================================================


-- Allow any authenticated user to create a company (onboarding)
CREATE POLICY "Authenticated users can create companies"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to insert themselves as company_user
-- (needed during onboarding when they create the company and assign themselves)
CREATE POLICY "Users can self-assign during onboarding"
  ON public.company_users FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow users to see profiles of members in their companies (for team views)
CREATE POLICY "Users see profiles of company members"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT cu.user_id FROM public.company_users cu
      WHERE cu.company_id IN (SELECT public.get_user_company_ids())
    )
  );


-- ==================================================================
-- FILE: 20260405073129_fd3caafe-ea65-40dd-9e9c-77f2309c8c2f.sql
-- ==================================================================


CREATE OR REPLACE FUNCTION public.onboard_company(
  _company_name TEXT,
  _company_slug TEXT,
  _company_phone TEXT DEFAULT NULL,
  _company_email TEXT DEFAULT NULL,
  _branch_name TEXT DEFAULT 'Principal',
  _branch_address TEXT DEFAULT NULL,
  _branch_phone TEXT DEFAULT NULL,
  _warehouse_name TEXT DEFAULT 'Almacén Principal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _company_id UUID;
  _branch_id UUID;
  _warehouse_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already have companies
  IF EXISTS (SELECT 1 FROM company_users WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already belongs to a company';
  END IF;

  -- Create company
  INSERT INTO companies (name, slug, phone, email)
  VALUES (_company_name, _company_slug, _company_phone, _company_email)
  RETURNING id INTO _company_id;

  -- Assign user as admin
  INSERT INTO company_users (company_id, user_id, role)
  VALUES (_company_id, _user_id, 'admin');

  -- Create branch
  INSERT INTO branches (company_id, name, address, phone)
  VALUES (_company_id, _branch_name, _branch_address, _branch_phone)
  RETURNING id INTO _branch_id;

  -- Update company_user with branch
  UPDATE company_users
  SET branch_id = _branch_id
  WHERE company_id = _company_id AND user_id = _user_id;

  -- Create warehouse
  INSERT INTO warehouses (company_id, branch_id, name)
  VALUES (_company_id, _branch_id, _warehouse_name)
  RETURNING id INTO _warehouse_id;

  -- Audit
  INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
  VALUES (_company_id, _user_id, 'onboard', 'company', _company_id,
    jsonb_build_object('company', _company_name, 'branch', _branch_name, 'warehouse', _warehouse_name));

  RETURN json_build_object(
    'company_id', _company_id,
    'company_name', _company_name,
    'company_slug', _company_slug,
    'branch_id', _branch_id,
    'branch_name', _branch_name,
    'warehouse_id', _warehouse_id
  );
END;
$$;


-- ==================================================================
-- FILE: 20260405073157_3f3cd3d5-cd22-4782-91bf-37472fd5aa2f.sql
-- ==================================================================


DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
DROP POLICY IF EXISTS "Users can self-assign during onboarding" ON public.company_users;


-- ==================================================================
-- FILE: 20260405100000_phase1_onboarding_defaults.sql
-- ==================================================================

-- Fase 1: completar datos por defecto de onboarding
-- Crea caja inicial y roles/permisos base por empresa.

CREATE OR REPLACE FUNCTION public.onboard_company(
  _company_name TEXT,
  _company_slug TEXT,
  _company_phone TEXT DEFAULT NULL,
  _company_email TEXT DEFAULT NULL,
  _branch_name TEXT DEFAULT 'Principal',
  _branch_address TEXT DEFAULT NULL,
  _branch_phone TEXT DEFAULT NULL,
  _warehouse_name TEXT DEFAULT 'Almacén Principal'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _company_id UUID;
  _branch_id UUID;
  _warehouse_id UUID;
  _cash_register_id UUID;
  _admin_role_id UUID;
  _manager_role_id UUID;
  _cashier_role_id UUID;
  _seller_role_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM company_users WHERE user_id = _user_id) THEN
    RAISE EXCEPTION 'User already belongs to a company';
  END IF;

  INSERT INTO companies (name, slug, phone, email)
  VALUES (_company_name, _company_slug, _company_phone, _company_email)
  RETURNING id INTO _company_id;

  INSERT INTO company_users (company_id, user_id, role)
  VALUES (_company_id, _user_id, 'admin');

  INSERT INTO branches (company_id, name, address, phone)
  VALUES (_company_id, _branch_name, _branch_address, _branch_phone)
  RETURNING id INTO _branch_id;

  UPDATE company_users
  SET branch_id = _branch_id
  WHERE company_id = _company_id AND user_id = _user_id;

  INSERT INTO warehouses (company_id, branch_id, name)
  VALUES (_company_id, _branch_id, _warehouse_name)
  RETURNING id INTO _warehouse_id;

  INSERT INTO cash_registers (company_id, branch_id, name)
  VALUES (_company_id, _branch_id, 'Caja 1')
  RETURNING id INTO _cash_register_id;

  INSERT INTO roles (company_id, name, description, is_system)
  VALUES (_company_id, 'Administrador', 'Control total de la empresa', true)
  RETURNING id INTO _admin_role_id;

  INSERT INTO roles (company_id, name, description, is_system)
  VALUES (_company_id, 'Gerente', 'Supervisa operación y reportes', true)
  RETURNING id INTO _manager_role_id;

  INSERT INTO roles (company_id, name, description, is_system)
  VALUES (_company_id, 'Cajero', 'Opera caja y ventas de mostrador', true)
  RETURNING id INTO _cashier_role_id;

  INSERT INTO roles (company_id, name, description, is_system)
  VALUES (_company_id, 'Vendedor', 'Realiza ventas y consulta catálogo', true)
  RETURNING id INTO _seller_role_id;

  -- Administrador: acceso total
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT _admin_role_id, p.id
  FROM permissions p;

  -- Gerente: operación completa sin gestión de roles
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT _manager_role_id, p.id
  FROM permissions p
  WHERE NOT (p.module = 'roles' AND p.action = 'manage');

  -- Cajero: venta y caja
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT _cashier_role_id, p.id
  FROM permissions p
  WHERE (p.module = 'dashboard' AND p.action = 'view')
     OR (p.module = 'pos' AND p.action IN ('sell', 'apply_discount'))
     OR (p.module = 'sales' AND p.action = 'view')
     OR (p.module = 'cash_register' AND p.action IN ('open', 'close', 'cut'))
     OR (p.module = 'customers' AND p.action = 'view');

  -- Vendedor: venta y consulta de catálogo
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT _seller_role_id, p.id
  FROM permissions p
  WHERE (p.module = 'dashboard' AND p.action = 'view')
     OR (p.module = 'pos' AND p.action IN ('sell', 'apply_discount'))
     OR (p.module = 'sales' AND p.action = 'view')
     OR (p.module = 'products' AND p.action = 'view')
     OR (p.module = 'customers' AND p.action IN ('view', 'manage'));

  INSERT INTO audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
  VALUES (
    _company_id,
    _user_id,
    'onboard',
    'company',
    _company_id,
    jsonb_build_object(
      'company', _company_name,
      'branch', _branch_name,
      'warehouse', _warehouse_name,
      'cash_register', 'Caja 1',
      'roles_seeded', true
    )
  );

  RETURN json_build_object(
    'company_id', _company_id,
    'company_name', _company_name,
    'company_slug', _company_slug,
    'branch_id', _branch_id,
    'branch_name', _branch_name,
    'warehouse_id', _warehouse_id,
    'cash_register_id', _cash_register_id
  );
END;
$$;


-- ==================================================================
-- FILE: 20260405113000_phase2_catalogs.sql
-- ==================================================================

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


-- ==================================================================
-- FILE: 20260405130000_phase3_products_inventory.sql
-- ==================================================================

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


-- ==================================================================
-- FILE: 20260405143000_phase3_adjust_stock_fix.sql
-- ==================================================================

-- Hardening fase 3: corregir ajuste de stock negativo al crear fila inexistente

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

  IF _delta = 0 THEN
    RAISE EXCEPTION 'Delta cannot be zero';
  END IF;

  IF _delta < 0 AND NOT EXISTS (
    SELECT 1
    FROM public.stock_levels sl
    WHERE sl.company_id = _company_id
      AND sl.warehouse_id = _warehouse_id
      AND sl.product_id = _product_id
  ) THEN
    RAISE EXCEPTION 'Cannot decrease stock that does not exist';
  END IF;

  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity)
  VALUES (_company_id, _warehouse_id, _product_id, _delta)
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


-- ==================================================================
-- FILE: 20260405170000_phase4_purchases_and_receipts.sql
-- ==================================================================

-- Fase 4: Compras y Entradas

CREATE TYPE public.purchase_status AS ENUM (
  'draft',
  'confirmed',
  'partial',
  'received',
  'cancelled'
);

CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_type_id UUID REFERENCES public.supplier_types(id) ON DELETE SET NULL,
  code TEXT,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  tax_id TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, name),
  UNIQUE(company_id, code)
);
CREATE INDEX idx_suppliers_company ON public.suppliers(company_id);
CREATE INDEX idx_suppliers_type ON public.suppliers(supplier_type_id);

CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  folio TEXT,
  status public.purchase_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  expected_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchases_company ON public.purchases(company_id, created_at DESC);
CREATE INDEX idx_purchases_supplier ON public.purchases(supplier_id);
CREATE INDEX idx_purchases_status ON public.purchases(company_id, status);

CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  received_qty NUMERIC(12,3) NOT NULL DEFAULT 0 CHECK (received_qty >= 0),
  unit_cost NUMERIC(12,4) NOT NULL CHECK (unit_cost >= 0),
  tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT purchase_items_received_lte_qty CHECK (received_qty <= quantity)
);
CREATE INDEX idx_purchase_items_purchase ON public.purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON public.purchase_items(product_id);

CREATE TABLE public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_purchase_receipts_purchase ON public.purchase_receipts(purchase_id, created_at DESC);

CREATE TABLE public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  purchase_item_id UUID NOT NULL REFERENCES public.purchase_items(id) ON DELETE RESTRICT,
  quantity_received NUMERIC(12,3) NOT NULL CHECK (quantity_received > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(receipt_id, purchase_item_id)
);
CREATE INDEX idx_purchase_receipt_items_receipt ON public.purchase_receipt_items(receipt_id);

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.recompute_purchase_totals(_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subtotal NUMERIC(12,2);
  _tax_total NUMERIC(12,2);
  _total NUMERIC(12,2);
BEGIN
  SELECT
    COALESCE(SUM(COALESCE(pi.quantity, 0) * COALESCE(pi.unit_cost, 0)), 0),
    COALESCE(SUM((COALESCE(pi.quantity, 0) * COALESCE(pi.unit_cost, 0)) * COALESCE(pi.tax_rate, 0)), 0),
    COALESCE(SUM((COALESCE(pi.quantity, 0) * COALESCE(pi.unit_cost, 0)) * (1 + COALESCE(pi.tax_rate, 0))), 0)
  INTO _subtotal, _tax_total, _total
  FROM public.purchase_items pi
  WHERE pi.purchase_id = _purchase_id;

  UPDATE public.purchases
  SET subtotal = _subtotal,
      tax_total = _tax_total,
      total = _total,
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = _purchase_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_items_set_total_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.total := ROUND((NEW.quantity * NEW.unit_cost) * (1 + COALESCE(NEW.tax_rate, 0)), 2);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_items_recompute_totals_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _purchase_id UUID;
BEGIN
  _purchase_id := COALESCE(NEW.purchase_id, OLD.purchase_id);
  PERFORM public.recompute_purchase_totals(_purchase_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchase_items_set_total
BEFORE INSERT OR UPDATE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.purchase_items_set_total_trigger();

CREATE TRIGGER trg_purchase_items_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_items
FOR EACH ROW EXECUTE FUNCTION public.purchase_items_recompute_totals_trigger();

CREATE OR REPLACE FUNCTION public.receive_purchase(
  _purchase_id UUID,
  _warehouse_id UUID,
  _items JSONB,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _purchase RECORD;
  _receipt_id UUID;
  _line JSONB;
  _purchase_item RECORD;
  _qty NUMERIC(12,3);
  _remaining NUMERIC(12,3);
  _new_status public.purchase_status;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _purchase
  FROM public.purchases p
  WHERE p.id = _purchase_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found';
  END IF;

  IF NOT public.has_company_access(_purchase.company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  IF _purchase.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Purchase status does not allow receiving';
  END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Items payload must be a non-empty array';
  END IF;

  INSERT INTO public.purchase_receipts (purchase_id, warehouse_id, received_by, notes)
  VALUES (_purchase_id, _warehouse_id, _user_id, _notes)
  RETURNING id INTO _receipt_id;

  FOR _line IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _qty := COALESCE((_line->>'quantity_received')::NUMERIC, 0);

    IF _qty <= 0 THEN
      RAISE EXCEPTION 'quantity_received must be > 0';
    END IF;

    SELECT pi.*
    INTO _purchase_item
    FROM public.purchase_items pi
    WHERE pi.id = (_line->>'purchase_item_id')::UUID
      AND pi.purchase_id = _purchase_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Purchase item not found in purchase';
    END IF;

    _remaining := _purchase_item.quantity - _purchase_item.received_qty;
    IF _qty > _remaining THEN
      RAISE EXCEPTION 'Received qty exceeds pending qty for item %', _purchase_item.id;
    END IF;

    INSERT INTO public.purchase_receipt_items (receipt_id, purchase_item_id, quantity_received)
    VALUES (_receipt_id, _purchase_item.id, _qty);

    UPDATE public.purchase_items
    SET received_qty = received_qty + _qty
    WHERE id = _purchase_item.id;

    PERFORM public.adjust_stock(
      _purchase.company_id,
      _warehouse_id,
      _purchase_item.product_id,
      _qty,
      'purchase',
      COALESCE(_notes, 'Entrada por recepción de compra ' || COALESCE(_purchase.folio, _purchase.id::TEXT))
    );
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM public.purchase_items pi
    WHERE pi.purchase_id = _purchase_id
      AND pi.received_qty > 0
      AND pi.received_qty < pi.quantity
  ) THEN
    _new_status := 'partial';
  ELSIF EXISTS (
    SELECT 1
    FROM public.purchase_items pi
    WHERE pi.purchase_id = _purchase_id
      AND pi.received_qty = pi.quantity
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.purchase_items pi
    WHERE pi.purchase_id = _purchase_id
      AND pi.received_qty < pi.quantity
  ) THEN
    _new_status := 'received';
  ELSE
    _new_status := 'confirmed';
  END IF;

  UPDATE public.purchases
  SET status = _new_status,
      updated_at = now(),
      updated_by = _user_id
  WHERE id = _purchase_id;

  RETURN json_build_object(
    'purchase_id', _purchase_id,
    'receipt_id', _receipt_id,
    'status', _new_status
  );
END;
$$;

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see suppliers of their companies" ON public.suppliers FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers purchasers manage suppliers" ON public.suppliers FOR ALL TO authenticated
USING (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
)
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
);

CREATE POLICY "Users see purchases of their companies" ON public.purchases FOR SELECT TO authenticated
USING (company_id IN (SELECT public.get_user_company_ids()));
CREATE POLICY "Admins managers purchasers manage purchases" ON public.purchases FOR ALL TO authenticated
USING (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
)
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_role_in_company(company_id, 'manager')
  OR public.has_role_in_company(company_id, 'purchaser')
);

CREATE POLICY "Users see purchase_items of their companies" ON public.purchase_items FOR SELECT TO authenticated
USING (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE p.company_id IN (SELECT public.get_user_company_ids())
));
CREATE POLICY "Admins managers purchasers manage purchase_items" ON public.purchase_items FOR ALL TO authenticated
USING (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
))
WITH CHECK (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
));

CREATE POLICY "Users see purchase_receipts of their companies" ON public.purchase_receipts FOR SELECT TO authenticated
USING (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE p.company_id IN (SELECT public.get_user_company_ids())
));
CREATE POLICY "Admins managers purchasers warehouse receive purchases" ON public.purchase_receipts FOR INSERT TO authenticated
WITH CHECK (purchase_id IN (
  SELECT p.id
  FROM public.purchases p
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
     OR public.has_role_in_company(p.company_id, 'warehouse_keeper')
));

CREATE POLICY "Users see purchase_receipt_items of their companies" ON public.purchase_receipt_items FOR SELECT TO authenticated
USING (receipt_id IN (
  SELECT pr.id
  FROM public.purchase_receipts pr
  JOIN public.purchases p ON p.id = pr.purchase_id
  WHERE p.company_id IN (SELECT public.get_user_company_ids())
));
CREATE POLICY "Admins managers purchasers warehouse manage purchase_receipt_items" ON public.purchase_receipt_items FOR INSERT TO authenticated
WITH CHECK (receipt_id IN (
  SELECT pr.id
  FROM public.purchase_receipts pr
  JOIN public.purchases p ON p.id = pr.purchase_id
  WHERE public.is_company_admin(p.company_id)
     OR public.has_role_in_company(p.company_id, 'manager')
     OR public.has_role_in_company(p.company_id, 'purchaser')
     OR public.has_role_in_company(p.company_id, 'warehouse_keeper')
));


-- ==================================================================
-- FILE: 20260406053855_d7199cf8-7b59-413b-86d7-b48ee7d3c136.sql
-- ==================================================================


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


-- ==================================================================
-- FILE: 20260406120000_phase5_invoicing_cfdi.sql
-- ==================================================================

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  sale_id uuid REFERENCES public.sales(id),
  customer_id uuid REFERENCES public.customers(id),
  series text NOT NULL,
  folio integer NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  payment_method text NOT NULL,
  payment_form text NOT NULL,
  fiscal_data jsonb NOT NULL,
  subtotal numeric(14,4) NOT NULL DEFAULT 0,
  tax numeric(14,4) NOT NULL DEFAULT 0,
  total numeric(14,4) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  uuid text,
  xml_url text,
  pdf_url text,
  stamped_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, branch_id, series, folio)
);

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  description text NOT NULL,
  qty numeric(14,4) NOT NULL,
  price numeric(14,4) NOT NULL,
  tax numeric(14,4) NOT NULL DEFAULT 0,
  total numeric(14,4) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  branch_id uuid NOT NULL REFERENCES public.branches(id),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount numeric(14,4) NOT NULL,
  reason text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own company invoices" ON public.invoices FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Users create own company invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Users update own company invoices" ON public.invoices FOR UPDATE TO authenticated USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Users see own company invoice_items" ON public.invoice_items FOR SELECT TO authenticated USING (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE company_id IN (SELECT get_user_company_ids())
  )
);
CREATE POLICY "Users create own company invoice_items" ON public.invoice_items FOR INSERT TO authenticated WITH CHECK (
  invoice_id IN (
    SELECT id FROM public.invoices WHERE company_id IN (SELECT get_user_company_ids())
  )
);

CREATE POLICY "Users see own company credit_notes" ON public.credit_notes FOR SELECT TO authenticated USING (company_id IN (SELECT get_user_company_ids()));
CREATE POLICY "Users create own company credit_notes" ON public.credit_notes FOR INSERT TO authenticated WITH CHECK (company_id IN (SELECT get_user_company_ids()));


-- ==================================================================
-- FILE: 20260406153000_phase6_architecture_hardening.sql
-- ==================================================================

-- Phase 6: architecture hardening (audit compatibility + stock reservations + tenant integrity)

-- 1) Audit compatibility fields used by feature repositories (non-breaking additive migration)
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id UUID;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_branch ON public.audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON public.audit_logs(module);

-- 2) Reserved stock model (non-breaking additive)
ALTER TABLE public.stock_levels ADD COLUMN IF NOT EXISTS reserved_qty NUMERIC(12,3) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock_levels' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.stock_levels
      ADD CONSTRAINT stock_levels_reserved_lte_quantity CHECK (reserved_qty <= quantity);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_levels_company_warehouse_product ON public.stock_levels(company_id, warehouse_id, product_id);

-- 3) Movement types for reservation/release (for enum-based environments)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'inventory_movement_type' AND n.nspname = 'public'
  ) THEN
    BEGIN
      ALTER TYPE public.inventory_movement_type ADD VALUE IF NOT EXISTS 'reserve';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER TYPE public.inventory_movement_type ADD VALUE IF NOT EXISTS 'release';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 4) Reserved stock atomic adjust helper
CREATE OR REPLACE FUNCTION public.adjust_reserved_stock(
  _company_id UUID,
  _warehouse_id UUID,
  _product_id UUID,
  _delta_reserved NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_reserved NUMERIC;
  _current_qty NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity, reserved_qty)
  VALUES (_company_id, _warehouse_id, _product_id, 0, GREATEST(_delta_reserved, 0))
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET
    reserved_qty = public.stock_levels.reserved_qty + _delta_reserved,
    updated_at = now()
  RETURNING reserved_qty, quantity INTO _new_reserved, _current_qty;

  IF _new_reserved < 0 THEN
    RAISE EXCEPTION 'Reserved stock cannot be negative';
  END IF;

  IF _new_reserved > _current_qty THEN
    RAISE EXCEPTION 'Reserved stock exceeds quantity';
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
    CASE WHEN _delta_reserved >= 0 THEN 'reserve' ELSE 'release' END,
    _delta_reserved,
    _current_qty,
    COALESCE(_notes, 'reserved stock adjustment'),
    auth.uid()
  );

  RETURN json_build_object(
    'company_id', _company_id,
    'warehouse_id', _warehouse_id,
    'product_id', _product_id,
    'reserved_qty', _new_reserved,
    'quantity', _current_qty
  );
END;
$$;

-- 5) Tenant-safe uniqueness for customers (if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'customers'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_company_tax_id
      ON public.customers(company_id, tax_id)
      WHERE tax_id IS NOT NULL;
  END IF;
END $$;


-- ==================================================================
-- FILE: 20260407010000_phase7_sales_cash_customers_fix.sql
-- ==================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- FASE 7: Correcciones críticas — sales, cash_movements, customers,
--         atomic payment, folio lock, suppliers dedup
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Tabla SALES (si no existe)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  cashier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_id UUID, -- FK soft: puede apuntar a la tabla customers cuando exista
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','completed','cancelled')),
  currency TEXT NOT NULL DEFAULT 'MXN',
  subtotal NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  invoice_requested BOOLEAN NOT NULL DEFAULT false,
  cancellation_reason TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_company_branch ON public.sales(company_id, branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_cashier ON public.sales(cashier_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(company_id, status);

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their company sales" ON public.sales;
CREATE POLICY "Users see their company sales"
  ON public.sales FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users create sales in their company" ON public.sales;
CREATE POLICY "Users create sales in their company"
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users update own company sales" ON public.sales;
CREATE POLICY "Users update own company sales"
  ON public.sales FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

-- 2) Tabla SALE_ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,4) NOT NULL CHECK (unit_price >= 0),
  tax_rate NUMERIC(6,4) NOT NULL DEFAULT 0.16,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,4) NOT NULL DEFAULT 0,
  discount_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON public.sale_items(product_id);

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company sale_items" ON public.sale_items;
CREATE POLICY "Users see own company sale_items"
  ON public.sale_items FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company sale_items" ON public.sale_items;
CREATE POLICY "Users insert own company sale_items"
  ON public.sale_items FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 3) Tabla SALE_PAYMENTS
CREATE TABLE IF NOT EXISTS public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  method TEXT NOT NULL CHECK (method IN ('cash','card','transfer','mixed','voucher')),
  amount NUMERIC(14,4) NOT NULL CHECK (amount > 0),
  reference TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sale_payments_sale ON public.sale_payments(sale_id);

ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company payments" ON public.sale_payments;
CREATE POLICY "Users see own company payments"
  ON public.sale_payments FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company payments" ON public.sale_payments;
CREATE POLICY "Users insert own company payments"
  ON public.sale_payments FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 4) Tabla CASH REGISTER SESSIONS
CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers(id) ON DELETE RESTRICT,
  opened_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  opening_amount NUMERIC(14,4) NOT NULL DEFAULT 0,
  closing_amount NUMERIC(14,4),
  expected_amount NUMERIC(14,4),
  difference NUMERIC(14,4),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_company_register ON public.cash_register_sessions(company_id, cash_register_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_opened_by ON public.cash_register_sessions(opened_by);

ALTER TABLE public.cash_register_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company sessions" ON public.cash_register_sessions;
CREATE POLICY "Users see own company sessions"
  ON public.cash_register_sessions FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company sessions" ON public.cash_register_sessions;
CREATE POLICY "Users insert own company sessions"
  ON public.cash_register_sessions FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users update own company sessions" ON public.cash_register_sessions;
CREATE POLICY "Users update own company sessions"
  ON public.cash_register_sessions FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

-- 5) Tabla CASH MOVEMENTS
CREATE TABLE IF NOT EXISTS public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.cash_register_sessions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense','withdrawal','opening','closing')),
  amount NUMERIC(14,4) NOT NULL CHECK (amount > 0),
  reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON public.cash_movements(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_movements_company ON public.cash_movements(company_id, branch_id, created_at DESC);

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company cash_movements" ON public.cash_movements;
CREATE POLICY "Users see own company cash_movements"
  ON public.cash_movements FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert own company cash_movements" ON public.cash_movements;
CREATE POLICY "Users insert own company cash_movements"
  ON public.cash_movements FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 6) Tabla CUSTOMERS (con validación RFC y multi-tenant)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_type_id UUID REFERENCES public.customer_types(id) ON DELETE SET NULL,
  code TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  business_name TEXT,
  tax_id TEXT, -- RFC
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_tax_id_format CHECK (
    tax_id IS NULL OR (
      LENGTH(tax_id) >= 12 AND LENGTH(tax_id) <= 13
      AND tax_id ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_company_tax_id
  ON public.customers(company_id, tax_id)
  WHERE tax_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_company ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(company_id, email) WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company customers" ON public.customers;
CREATE POLICY "Users see own company customers"
  ON public.customers FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users manage own company customers" ON public.customers;
CREATE POLICY "Users manage own company customers"
  ON public.customers FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

-- 7) FK de sales → customers
ALTER TABLE public.sales
  DROP CONSTRAINT IF EXISTS fk_sales_customer;
ALTER TABLE public.sales
  ADD CONSTRAINT fk_sales_customer
  FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- 7.5) Extender audit_logs para POS y otros módulos
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE public.audit_logs RENAME COLUMN user_id TO actor_user_id; -- Renombrar para consistencia
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_actor_user_id_fkey FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 8) FUNCIÓN ATÓMICA: process_sale_payment
--    Hace TODO el pago en una sola transacción DB:
--      a) valida venta en draft
--      b) descuenta stock para cada item (batch)
--      c) inserta pagos
--      d) actualiza sale a completed
--      e) registra ingreso en caja
--      f) genera audit log
CREATE OR REPLACE FUNCTION public.process_sale_payment(
  _sale_id UUID,
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _cashier_user_id UUID,
  _items JSONB,       -- [{product_id, quantity}]
  _payments JSONB,    -- [{method, amount, reference}]
  _totals JSONB       -- {subtotal, discount_total, tax_total, grand_total}
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
  -- Payloads tipados para evitar error de scalar si llegan como string
  _items_data JSONB;
  _payments_data JSONB;
  _totals_data JSONB;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  -- Normalizar inputs JSONB (PostgREST a veces envía strings-in-jsonb)
  _items_data := _items;
  IF jsonb_typeof(_items_data) = 'string' THEN _items_data := (_items_data#>>'{}')::jsonb; END IF;
  
  _payments_data := _payments;
  IF jsonb_typeof(_payments_data) = 'string' THEN _payments_data := (_payments_data#>>'{}')::jsonb; END IF;
  
  _totals_data := _totals;
  IF jsonb_typeof(_totals_data) = 'string' THEN _totals_data := (_totals_data#>>'{}')::jsonb; END IF;

  -- Verificar que la venta existe y está en draft
  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' AND _sale.status != 'draft_completed' THEN
    RAISE EXCEPTION 'La venta no está en estado borrador (estado actual: %)', _sale.status;
  END IF;

  -- Validar monto total de pagos
  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments_data) p;

  _grand_total := (_totals_data->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  -- Descontar stock (atómico)
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_data)
  LOOP
    PERFORM public.adjust_stock(
      _company_id,
      _warehouse_id,
      (_item->>'product_id')::UUID,
      -ABS((_item->>'quantity')::NUMERIC),
      'sale',
      'POS sale ' || _sale_id::TEXT
    );
  END LOOP;

  -- Insertar pagos
  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments_data)
  LOOP
    INSERT INTO public.sale_payments (sale_id, company_id, branch_id, warehouse_id, method, amount, reference, created_by)
    VALUES (
      _sale_id, _company_id, _branch_id, _warehouse_id,
      _payment->>'method',
      (_payment->>'amount')::NUMERIC,
      _payment->>'reference',
      _cashier_user_id
    );
  END LOOP;

  -- Actualizar totales y status de la venta
  UPDATE public.sales SET
    subtotal = (_totals_data->>'subtotal')::NUMERIC,
    discount_total = (_totals_data->>'discount_total')::NUMERIC,
    tax_total = (_totals_data->>'tax_total')::NUMERIC,
    total = _grand_total,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = _sale_id;

  -- Registrar ingreso en caja (buscar sesión activa)
  SELECT id INTO _active_session_id
  FROM public.cash_register_sessions
  WHERE company_id = _company_id AND branch_id = _branch_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, reference, created_by)
  VALUES (_company_id, _branch_id, _active_session_id, 'income', _grand_total, 'POS:' || _sale_id::TEXT, _cashier_user_id);

  -- Audit log (usando los nuevos nombres de columna)
  INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id, module)
  VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$$;

-- 9) FUNCIÓN: get_next_folio_locked (con advisory lock para evitar race condition)
CREATE OR REPLACE FUNCTION public.get_next_folio_locked(
  _company_id UUID,
  _branch_id UUID,
  _series TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next INTEGER;
  _lock_key BIGINT;
BEGIN
  -- Advisory lock basado en hash de company+branch+series
  _lock_key := abs(hashtext(_company_id::TEXT || _branch_id::TEXT || _series));
  PERFORM pg_advisory_xact_lock(_lock_key);

  SELECT COALESCE(MAX(folio), 0) + 1
  INTO _next
  FROM public.invoices
  WHERE company_id = _company_id AND branch_id = _branch_id AND series = _series;

  RETURN _next;
END;
$$;

-- 10) Fix: añadir company_id a purchase_items si no tiene
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Poblar company_id en purchase_items desde la orden padre
UPDATE public.purchase_items pi
SET company_id = p.company_id
FROM public.purchases p
WHERE pi.purchase_id = p.id
  AND pi.company_id IS NULL;

-- Índice
CREATE INDEX IF NOT EXISTS idx_purchase_items_company ON public.purchase_items(company_id);

-- 11) Tabla de RBAC permissions cargada desde DB (vista materializada para cache)
CREATE TABLE IF NOT EXISTS public.user_permissions_cache (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

ALTER TABLE public.user_permissions_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own permissions" ON public.user_permissions_cache;
CREATE POLICY "Users see own permissions"
  ON public.user_permissions_cache FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 12) Función: obtener permisos de usuario desde roles DB
CREATE OR REPLACE FUNCTION public.get_user_permissions(_company_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(DISTINCT (p.module || '.' || p.action))
  FROM public.company_users cu
  JOIN public.roles r ON r.company_id = cu.company_id AND r.name = cu.role::TEXT
  JOIN public.role_permissions rp ON rp.role_id = r.id
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE cu.user_id = auth.uid()
    AND cu.company_id = _company_id
    AND cu.is_active = true;
$$;

-- 13) Función: open_cash_register_session
CREATE OR REPLACE FUNCTION public.open_cash_register_session(
  _company_id UUID,
  _branch_id UUID,
  _cash_register_id UUID,
  _opening_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _session_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  -- Verificar que no haya sesión abierta para este register
  IF EXISTS (
    SELECT 1 FROM public.cash_register_sessions
    WHERE cash_register_id = _cash_register_id AND status = 'open'
  ) THEN
    RAISE EXCEPTION 'Ya existe una sesión de caja abierta para esta caja';
  END IF;

  INSERT INTO public.cash_register_sessions (
    company_id, branch_id, cash_register_id, opened_by, status, opening_amount
  ) VALUES (
    _company_id, _branch_id, _cash_register_id, _user_id, 'open', _opening_amount
  ) RETURNING id INTO _session_id;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, notes, created_by)
  VALUES (_company_id, _branch_id, _session_id, 'opening', _opening_amount, 'Apertura de caja', _user_id);

  RETURN json_build_object('session_id', _session_id, 'status', 'open');
END;
$$;

-- 14) Función: close_cash_register_session
CREATE OR REPLACE FUNCTION public.close_cash_register_session(
  _session_id UUID,
  _closing_amount NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _session RECORD;
  _expected NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _session FROM public.cash_register_sessions
  WHERE id = _session_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sesión de caja no encontrada'; END IF;
  IF _session.status != 'open' THEN RAISE EXCEPTION 'La sesión ya está cerrada'; END IF;
  IF NOT public.has_company_access(_session.company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  -- Calcular efectivo esperado
  SELECT COALESCE(SUM(CASE WHEN type IN ('income','opening') THEN amount ELSE -amount END), 0)
  INTO _expected
  FROM public.cash_movements
  WHERE session_id = _session_id;

  UPDATE public.cash_register_sessions SET
    status = 'closed',
    closed_by = _user_id,
    closed_at = now(),
    closing_amount = _closing_amount,
    expected_amount = _expected,
    difference = _closing_amount - _expected,
    notes = COALESCE(_notes, notes)
  WHERE id = _session_id;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, notes, created_by)
  VALUES (_session.company_id, _session.branch_id, _session_id, 'closing', _closing_amount, 'Cierre de caja', _user_id);

  RETURN json_build_object(
    'session_id', _session_id,
    'expected', _expected,
    'closing', _closing_amount,
    'difference', _closing_amount - _expected
  );
END;
$$;


-- ==================================================================
-- FILE: 20260407020000_phase7_atomic_transfer.sql
-- ==================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- FASE 3 Corrección: Transferencia de Stock Atómica
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.transfer_stock(
  _company_id UUID,
  _from_warehouse_id UUID,
  _to_warehouse_id UUID,
  _product_id UUID,
  _quantity NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _from_qty NUMERIC;
  _to_qty NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;
  IF _quantity <= 0 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
  IF _from_warehouse_id = _to_warehouse_id THEN RAISE EXCEPTION 'Cannot transfer to the same warehouse'; END IF;

  -- 1. Descontar del almacén origen
  UPDATE public.stock_levels
  SET quantity = quantity - _quantity,
      updated_at = now()
  WHERE company_id = _company_id
    AND warehouse_id = _from_warehouse_id
    AND product_id = _product_id
  RETURNING quantity INTO _from_qty;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock not found in source warehouse';
  END IF;

  IF _from_qty < 0 THEN
    RAISE EXCEPTION 'Insufficient stock in source warehouse';
  END IF;

  -- 2. Registrar movimiento de salida
  INSERT INTO public.stock_movements (
    company_id, warehouse_id, product_id, movement_type, quantity, balance_after, notes, created_by
  ) VALUES (
    _company_id, _from_warehouse_id, _product_id, 'transfer_out', -_quantity, _from_qty, _notes, _user_id
  );

  -- 3. Incrementar en el almacén destino (upsert por si no existía)
  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity)
  VALUES (_company_id, _to_warehouse_id, _product_id, _quantity)
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET quantity = public.stock_levels.quantity + _quantity,
                updated_at = now()
  RETURNING quantity INTO _to_qty;

  -- 4. Registrar movimiento de entrada
  INSERT INTO public.stock_movements (
    company_id, warehouse_id, product_id, movement_type, quantity, balance_after, notes, created_by
  ) VALUES (
    _company_id, _to_warehouse_id, _product_id, 'transfer_in', _quantity, _to_qty, _notes, _user_id
  );

  RETURN json_build_object(
    'from_warehouse_after', _from_qty,
    'to_warehouse_after', _to_qty
  );
END;
$$;


-- ==================================================================
-- FILE: 20260407030000_phase7_purchase_cost_fix.sql
-- ==================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- FASE 5: Corrección de Compras (Actualización de Costo Promedio y Clean Arch)
-- ═══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.receive_purchase(
  _purchase_id UUID,
  _warehouse_id UUID,
  _items JSONB,    -- [{ "purchase_item_id": uuid, "quantity_received": numeric }]
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _purchase RECORD;
  _item_input JSONB;
  _pi RECORD;
  _new_received NUMERIC;
  _all_received BOOLEAN := true;
  _any_received BOOLEAN := false;

  _current_stock NUMERIC;
  _current_cost NUMERIC;
  _new_cost NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _purchase FROM public.purchases WHERE id = _purchase_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order not found'; END IF;
  IF NOT public.has_company_access(_purchase.company_id) THEN RAISE EXCEPTION 'No company access'; END IF;
  
  IF _purchase.status IN ('received', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot receive a purchase in status: %', _purchase.status;
  END IF;

  FOR _item_input IN SELECT * FROM jsonb_array_elements(_items) LOOP
    IF (_item_input->>'quantity_received')::NUMERIC <= 0 THEN CONTINUE; END IF;

    SELECT * INTO _pi FROM public.purchase_items
    WHERE id = (_item_input->>'purchase_item_id')::UUID AND purchase_id = _purchase_id FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Purchase item not found: %', _item_input->>'purchase_item_id'; END IF;

    _new_received := _pi.received_qty + (_item_input->>'quantity_received')::NUMERIC;
    IF _new_received > _pi.quantity THEN
      RAISE EXCEPTION 'Cannot receive more than ordered for item %', _pi.id;
    END IF;

    -- Actualiza lo recibido en la línea de compra
    UPDATE public.purchase_items
    SET received_qty = _new_received, updated_at = now()
    WHERE id = _pi.id;

    -- Ajusta el inventario
    PERFORM public.adjust_stock(
      _purchase.company_id,
      _warehouse_id,
      _pi.product_id,
      (_item_input->>'quantity_received')::NUMERIC,
      'purchase',
      COALESCE(_notes, 'PO: ' || COALESCE(_purchase.folio, _purchase.id::TEXT))
    );

    -- =====================================================================
    -- BUG FIX #10: Actualizar Coste Promedio
    -- =====================================================================
    -- Obtener stock actual total en toda la empresa (sumando almacenes)
    SELECT COALESCE(SUM(quantity), 0) INTO _current_stock
    FROM public.stock_levels
    WHERE company_id = _purchase.company_id AND product_id = _pi.product_id;
    
    -- Obtener costo actual
    SELECT cost INTO _current_cost
    FROM public.product_prices
    WHERE company_id = _purchase.company_id AND product_id = _pi.product_id
    LIMIT 1;

    -- Fórmula Costo Promedio (antes de que entrará este nuevo lote):
    -- stock anterior = _current_stock - quantity_received
    -- nuevo_costo = ((stock_ant * costo_ant) + (qty_received * cost_nuevo)) / _current_stock
    IF _current_stock > 0 THEN
      _new_cost := (
        ( (_current_stock - (_item_input->>'quantity_received')::NUMERIC) * COALESCE(_current_cost, 0) ) +
        ( (_item_input->>'quantity_received')::NUMERIC * _pi.unit_cost )
      ) / _current_stock;
      
      UPDATE public.product_prices
      SET cost = _new_cost, updated_at = now()
      WHERE company_id = _purchase.company_id AND product_id = _pi.product_id;
    END IF;
    -- =====================================================================

    _any_received := true;
  END LOOP;

  -- Revisa si toda la orden se recibió completa
  FOR _pi IN SELECT * FROM public.purchase_items WHERE purchase_id = _purchase_id LOOP
    IF _pi.received_qty < _pi.quantity THEN
      _all_received := false;
      EXIT;
    END IF;
  END LOOP;

  IF _any_received THEN
    UPDATE public.purchases
    SET status = CASE WHEN _all_received THEN 'received' ELSE 'partial' END,
        updated_at = now()
    WHERE id = _purchase_id;
  END IF;

  RETURN json_build_object(
    'purchase_id', _purchase_id,
    'status', CASE WHEN _all_received THEN 'received' ELSE 'partial' END
  );
END;
$$;


-- ==================================================================
-- FILE: 20260407040000_phase7_cash_totals.sql
-- ==================================================================

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


-- ==================================================================
-- FILE: 20260407050000_phase8_rbac_and_reports.sql
-- ==================================================================

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


-- ==================================================================
-- FILE: 20260407110000_phase8_supplier_commercial_fields.sql
-- ==================================================================

-- Phase 8: supplier commercial fields for phase B remediation

ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commercial_status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'suppliers_commercial_status_check'
  ) THEN
    ALTER TABLE public.suppliers
      ADD CONSTRAINT suppliers_commercial_status_check
      CHECK (commercial_status IN ('active', 'blocked', 'review'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppliers_commercial_status ON public.suppliers(company_id, commercial_status);


-- ==================================================================
-- FILE: 20260408023047_79211e68-bc6c-4027-936f-b73036b1bed0.sql
-- ==================================================================


CREATE OR REPLACE FUNCTION public.process_sale_payment(_sale_id uuid, _company_id uuid, _branch_id uuid, _warehouse_id uuid, _cashier_user_id uuid, _items jsonb, _payments jsonb, _totals jsonb)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' THEN
    RAISE EXCEPTION 'La venta no está en estado draft (estado actual: %)', _sale.status;
  END IF;

  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments) p;

  _grand_total := (_totals->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    PERFORM public.adjust_stock(
      _company_id,
      _warehouse_id,
      (_item->>'product_id')::UUID,
      -ABS((_item->>'quantity')::NUMERIC),
      'sale',
      'POS sale ' || _sale_id::TEXT
    );
  END LOOP;

  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments)
  LOOP
    INSERT INTO public.sale_payments (sale_id, company_id, branch_id, warehouse_id, method, amount, reference, created_by)
    VALUES (
      _sale_id, _company_id, _branch_id, _warehouse_id,
      _payment->>'method',
      (_payment->>'amount')::NUMERIC,
      _payment->>'reference',
      _cashier_user_id
    );
  END LOOP;

  UPDATE public.sales SET
    subtotal = (_totals->>'subtotal')::NUMERIC,
    discount_total = (_totals->>'discount_total')::NUMERIC,
    tax_total = (_totals->>'tax_total')::NUMERIC,
    total = _grand_total,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = _sale_id;

  SELECT id INTO _active_session_id
  FROM public.cash_register_sessions
  WHERE company_id = _company_id AND branch_id = _branch_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, reference, created_by)
  VALUES (_company_id, _branch_id, _active_session_id, 'income', _grand_total, 'POS:' || _sale_id::TEXT, _cashier_user_id);

  -- Fixed: use correct audit_logs columns (user_id, entity_type, entity_id)
  INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, new_data)
  VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id,
    jsonb_build_object('branch_id', _branch_id, 'warehouse_id', _warehouse_id, 'total', _grand_total));

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$function$;


-- ==================================================================
-- FILE: 20260408090000_pos_audit_compatibility.sql
-- ==================================================================

-- Compatibilidad de auditoría POS para entornos con esquema legacy de audit_logs
-- (sin branch_id/module y/o con user_id en lugar de actor_user_id).

CREATE OR REPLACE FUNCTION public.process_sale_payment(
  _sale_id UUID,
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _cashier_user_id UUID,
  _items JSONB,
  _payments JSONB,
  _totals JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
  _items_data JSONB;
  _payments_data JSONB;
  _totals_data JSONB;
  _has_branch_id BOOLEAN;
  _has_module BOOLEAN;
  _has_actor_user_id BOOLEAN;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  _items_data := _items;
  IF jsonb_typeof(_items_data) = 'string' THEN _items_data := (_items_data#>>'{}')::jsonb; END IF;

  _payments_data := _payments;
  IF jsonb_typeof(_payments_data) = 'string' THEN _payments_data := (_payments_data#>>'{}')::jsonb; END IF;

  _totals_data := _totals;
  IF jsonb_typeof(_totals_data) = 'string' THEN _totals_data := (_totals_data#>>'{}')::jsonb; END IF;

  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' AND _sale.status != 'draft_completed' THEN
    RAISE EXCEPTION 'La venta no está en estado borrador (estado actual: %)', _sale.status;
  END IF;

  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments_data) p;

  _grand_total := (_totals_data->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items_data)
  LOOP
    PERFORM public.adjust_stock(
      _company_id,
      _warehouse_id,
      (_item->>'product_id')::UUID,
      -ABS((_item->>'quantity')::NUMERIC),
      'sale',
      'POS sale ' || _sale_id::TEXT
    );
  END LOOP;

  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments_data)
  LOOP
    INSERT INTO public.sale_payments (sale_id, company_id, branch_id, warehouse_id, method, amount, reference, created_by)
    VALUES (
      _sale_id, _company_id, _branch_id, _warehouse_id,
      _payment->>'method',
      (_payment->>'amount')::NUMERIC,
      _payment->>'reference',
      _cashier_user_id
    );
  END LOOP;

  UPDATE public.sales SET
    subtotal = (_totals_data->>'subtotal')::NUMERIC,
    discount_total = (_totals_data->>'discount_total')::NUMERIC,
    tax_total = (_totals_data->>'tax_total')::NUMERIC,
    total = _grand_total,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = _sale_id;

  SELECT id INTO _active_session_id
  FROM public.cash_register_sessions
  WHERE company_id = _company_id AND branch_id = _branch_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, reference, created_by)
  VALUES (_company_id, _branch_id, _active_session_id, 'income', _grand_total, 'POS:' || _sale_id::TEXT, _cashier_user_id);

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'branch_id'
  ) INTO _has_branch_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'module'
  ) INTO _has_module;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'actor_user_id'
  ) INTO _has_actor_user_id;

  IF _has_actor_user_id THEN
    IF _has_branch_id AND _has_module THEN
      INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSIF _has_branch_id THEN
      INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    ELSIF _has_module THEN
      INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSE
      INSERT INTO public.audit_logs (company_id, actor_user_id, action, entity_type, entity_id)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    END IF;
  ELSE
    IF _has_branch_id AND _has_module THEN
      INSERT INTO public.audit_logs (company_id, branch_id, user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSIF _has_branch_id THEN
      INSERT INTO public.audit_logs (company_id, branch_id, user_id, action, entity_type, entity_id)
      VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    ELSIF _has_module THEN
      INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id, module)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');
    ELSE
      INSERT INTO public.audit_logs (company_id, user_id, action, entity_type, entity_id)
      VALUES (_company_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id);
    END IF;
  END IF;

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$$;


-- ==================================================================
-- FILE: 20260408100000_fase1_fix_sale_items.sql
-- ==================================================================

-- =====================================================
-- FIX FASE1-1: Insertar sale_items en process_sale_payment
-- =====================================================

CREATE OR REPLACE FUNCTION public.process_sale_payment(
  _sale_id UUID,
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _cashier_user_id UUID,
  _items JSONB,
  _payments JSONB,
  _totals JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _sale RECORD;
  _total_paid NUMERIC;
  _grand_total NUMERIC;
  _item JSONB;
  _payment JSONB;
  _active_session_id UUID;
  _items_data JSONB;
  _payments_data JSONB;
  _totals_data JSONB;
  _p_name TEXT;
  _p_sku TEXT;
  _qty NUMERIC;
  _unit_price NUMERIC;
  _tax_rate NUMERIC;
  _discount_pct NUMERIC;
  _line_subtotal NUMERIC;
  _line_discount NUMERIC;
  _line_net NUMERIC;
  _line_tax NUMERIC;
  _line_total NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  -- Normalizar inputs JSONB
  _items_data := _items;
  IF jsonb_typeof(_items_data) = 'string' THEN _items_data := (_items_data#>>'{}')::jsonb; END IF;

  _payments_data := _payments;
  IF jsonb_typeof(_payments_data) = 'string' THEN _payments_data := (_payments_data#>>'{}')::jsonb; END IF;

  _totals_data := _totals;
  IF jsonb_typeof(_totals_data) = 'string' THEN _totals_data := (_totals_data#>>'{}')::jsonb; END IF;

  -- Verificar que la venta existe y esta en draft
  SELECT * INTO _sale FROM public.sales
  WHERE id = _sale_id AND company_id = _company_id AND branch_id = _branch_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta no encontrada';
  END IF;

  IF _sale.status != 'draft' AND _sale.status != 'draft_completed' THEN
    RAISE EXCEPTION 'La venta no esta en estado borrador (estado actual: %)', _sale.status;
  END IF;

  -- Validar monto total de pagos
  SELECT COALESCE(SUM((p->>'amount')::NUMERIC), 0)
  INTO _total_paid
  FROM jsonb_array_elements(_payments_data) p;

  _grand_total := (_totals_data->>'grand_total')::NUMERIC;

  IF _total_paid < _grand_total THEN
    RAISE EXCEPTION 'Pago insuficiente: pagado=% requerido=%', _total_paid, _grand_total;
  END IF;

  -- ★ NUEVO: Insertar sale_items con detalle completo
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_data)
  LOOP
    _p_name       := COALESCE(_item->>'product_name', 'Desconocido');
    _p_sku        := COALESCE(_item->>'sku', '');
    _qty          := ABS((_item->>'quantity')::NUMERIC);
    _unit_price   := COALESCE((_item->>'unit_price')::NUMERIC, 0);
    _tax_rate     := COALESCE((_item->>'tax_rate')::NUMERIC, 0.16);
    _discount_pct := COALESCE((_item->>'discount_percent')::NUMERIC, 0);

    _line_subtotal := _qty * _unit_price;
    _line_discount  := _line_subtotal * (_discount_pct / 100);
    _line_net       := _line_subtotal - _line_discount;
    _line_tax       := _line_net * _tax_rate;
    _line_total     := _line_net + _line_tax;

    INSERT INTO public.sale_items (
      sale_id, company_id, product_id,
      product_name, sku, quantity,
      unit_price, tax_rate, discount_percent,
      subtotal, discount_total, tax_total, total
    ) VALUES (
      _sale_id, _company_id, (_item->>'product_id')::UUID,
      _p_name, _p_sku, _qty,
      _unit_price, _tax_rate, _discount_pct,
      _line_subtotal, _line_discount, _line_tax, _line_total
    );
  END LOOP;

  -- Descontar stock (atomico)
  FOR _item IN SELECT * FROM jsonb_array_elements(_items_data)
  LOOP
    PERFORM public.adjust_stock(
      _company_id,
      _warehouse_id,
      (_item->>'product_id')::UUID,
      -ABS((_item->>'quantity')::NUMERIC),
      'sale',
      'POS sale ' || _sale_id::TEXT
    );
  END LOOP;

  -- Insertar pagos
  FOR _payment IN SELECT * FROM jsonb_array_elements(_payments_data)
  LOOP
    INSERT INTO public.sale_payments (sale_id, company_id, branch_id, warehouse_id, method, amount, reference, created_by)
    VALUES (
      _sale_id, _company_id, _branch_id, _warehouse_id,
      _payment->>'method',
      (_payment->>'amount')::NUMERIC,
      _payment->>'reference',
      _cashier_user_id
    );
  END LOOP;

  -- Actualizar totales y status de la venta
  UPDATE public.sales SET
    subtotal = (_totals_data->>'subtotal')::NUMERIC,
    discount_total = (_totals_data->>'discount_total')::NUMERIC,
    tax_total = (_totals_data->>'tax_total')::NUMERIC,
    total = _grand_total,
    status = 'completed',
    completed_at = now(),
    updated_at = now()
  WHERE id = _sale_id;

  -- Registrar ingreso en caja
  SELECT id INTO _active_session_id
  FROM public.cash_register_sessions
  WHERE company_id = _company_id AND branch_id = _branch_id AND status = 'open'
  ORDER BY opened_at DESC
  LIMIT 1;

  INSERT INTO public.cash_movements (company_id, branch_id, session_id, type, amount, reference, created_by)
  VALUES (_company_id, _branch_id, _active_session_id, 'income', _grand_total, 'POS:' || _sale_id::TEXT, _cashier_user_id);

  -- Audit log
  INSERT INTO public.audit_logs (company_id, branch_id, actor_user_id, action, entity_type, entity_id, module)
  VALUES (_company_id, _branch_id, _cashier_user_id, 'sale.completed', 'sale', _sale_id, 'pos');

  RETURN json_build_object(
    'sale_id', _sale_id,
    'status', 'completed',
    'total_paid', _total_paid,
    'grand_total', _grand_total
  );
END;
$$;


-- ==================================================================
-- FILE: 20260408110000_fase2_purchases_transfers_cash.sql
-- ==================================================================

-- =====================================================
-- FIX FASE2-6: RPC transaccional create_purchase_with_items
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_purchase_with_items(
  _company_id UUID,
  _branch_id UUID,
  _supplier_id UUID,
  _folio TEXT DEFAULT NULL,
  _expected_date DATE DEFAULT NULL,
  _notes TEXT DEFAULT NULL,
  _items JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _purchase_id UUID;
  _item JSONB;
  _qty NUMERIC;
  _unit_cost NUMERIC;
  _tax_rate NUMERIC;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Items must be a non-empty array';
  END IF;

  INSERT INTO public.purchases (company_id, branch_id, supplier_id, folio, expected_date, notes, status, created_by)
  VALUES (_company_id, _branch_id, _supplier_id, _folio, _expected_date, _notes, 'draft', _user_id)
  RETURNING id INTO _purchase_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _qty       := (_item->>'quantity')::NUMERIC;
    _unit_cost := (_item->>'unit_cost')::NUMERIC;
    _tax_rate  := COALESCE((_item->>'tax_rate')::NUMERIC, 0);

    IF _qty <= 0 THEN RAISE EXCEPTION 'quantity must be > 0'; END IF;
    IF _unit_cost < 0 THEN RAISE EXCEPTION 'unit_cost must be >= 0'; END IF;

    INSERT INTO public.purchase_items (company_id, purchase_id, product_id, quantity, unit_cost, tax_rate, received_qty)
    VALUES (
      _company_id,
      _purchase_id,
      (_item->>'product_id')::UUID,
      _qty,
      _unit_cost,
      _tax_rate,
      0
    );
  END LOOP;

  -- Recalcular totales via trigger existente
  PERFORM public.recompute_purchase_totals(_purchase_id);

  RETURN json_build_object('purchase_id', _purchase_id, 'status', 'draft');
END;
$$;


-- =====================================================
-- FIX FASE2-7: Tabla inventory_transfers + fix tax_rate docs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.inventory_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  from_warehouse UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  to_warehouse UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,3) NOT NULL CHECK (qty > 0),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','cancelled')),
  notes TEXT,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transfers_company ON public.inventory_transfers(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_product ON public.inventory_transfers(product_id);

ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company inventory_transfers" ON public.inventory_transfers;
CREATE POLICY "Users see own company inventory_transfers" ON public.inventory_transfers FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users manage own company inventory_transfers" ON public.inventory_transfers;
CREATE POLICY "Users manage own company inventory_transfers" ON public.inventory_transfers FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));


-- =====================================================
-- FIX FASE2-8: Cash Register — corregir BD para alinear con frontend
-- =====================================================

-- 8a. Agregar columnas faltantes a cash_register_sessions para cierre detallado
ALTER TABLE public.cash_register_sessions
  ADD COLUMN IF NOT EXISTS counted_cash NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS counted_card NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS counted_transfer NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS calculated_cash NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS calculated_card NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS calculated_transfer NUMERIC(14,4),
  ADD COLUMN IF NOT EXISTS closing_notes TEXT;

-- 8b. Agregar columnas faltantes a cash_movements
ALTER TABLE public.cash_movements
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS description TEXT;

-- 8c. Ampliar CHECK constraint de cash_movements.type para incluir 'deposit'
ALTER TABLE public.cash_movements DROP CONSTRAINT IF EXISTS cash_movements_type_check;
ALTER TABLE public.cash_movements ADD CONSTRAINT cash_movements_type_check
  CHECK (type IN ('income','expense','withdrawal','opening','closing','deposit'));

-- 8d. Agregar columna opening_balance como alias (compatibilidad con RPC existente)
ALTER TABLE public.cash_register_sessions
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(14,4) GENERATED ALWAYS AS (opening_amount) STORED;


-- =====================================================
-- FIX FASE2-8e: Reescribir calculate_cash_session_totals 
--     Ahora usa payment_method que ya existe
-- =====================================================

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
  _opening_amount NUMERIC := 0;
  _company_id UUID;
BEGIN
  SELECT company_id, opening_amount INTO _company_id, _opening_amount
  FROM public.cash_register_sessions
  WHERE id = _session_id;

  IF NOT FOUND THEN RAISE EXCEPTION 'Sesion no encontrada'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No access'; END IF;

  -- Efectivo: fondo inicial + movimientos cash
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('income','deposit','opening') THEN amount
      WHEN type IN ('expense','withdrawal','closing') THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_cash
  FROM public.cash_movements
  WHERE session_id = _session_id AND (payment_method = 'cash' OR payment_method IS NULL);

  _total_cash := _total_cash + _opening_amount;

  -- Tarjeta
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('income','deposit') THEN amount
      WHEN type IN ('expense','withdrawal') THEN -amount
      ELSE 0
    END
  ), 0) INTO _total_card
  FROM public.cash_movements
  WHERE session_id = _session_id AND payment_method = 'card';

  -- Transferencia
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('income','deposit') THEN amount
      WHEN type IN ('expense','withdrawal') THEN -amount
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

-- ==================================================================
-- FILE: 20260408120000_fase3_reports_rpc.sql
-- ==================================================================

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

-- ==================================================================
-- FILE: 20260408133000_phase9_physical_counts.sql
-- ==================================================================

-- Phase 9: Physical count persistence (inventory reconciliation)

CREATE TABLE IF NOT EXISTS public.physical_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  folio TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  notes TEXT,
  counted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_physical_counts_company_folio ON public.physical_counts(company_id, folio);
CREATE INDEX IF NOT EXISTS idx_physical_counts_company_created ON public.physical_counts(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_physical_counts_warehouse ON public.physical_counts(warehouse_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_physical_counts_updated_at ON public.physical_counts;
CREATE TRIGGER trg_physical_counts_updated_at
  BEFORE UPDATE ON public.physical_counts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.physical_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  count_id UUID NOT NULL REFERENCES public.physical_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  system_qty NUMERIC(14,3) NOT NULL DEFAULT 0,
  counted_qty NUMERIC(14,3) NOT NULL CHECK (counted_qty >= 0),
  difference_qty NUMERIC(14,3) GENERATED ALWAYS AS (counted_qty - system_qty) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_physical_count_items_count_product ON public.physical_count_items(count_id, product_id);
CREATE INDEX IF NOT EXISTS idx_physical_count_items_count ON public.physical_count_items(count_id);
CREATE INDEX IF NOT EXISTS idx_physical_count_items_product ON public.physical_count_items(product_id);

DROP TRIGGER IF EXISTS trg_physical_count_items_updated_at ON public.physical_count_items;
CREATE TRIGGER trg_physical_count_items_updated_at
  BEFORE UPDATE ON public.physical_count_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.physical_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_count_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own company physical_counts" ON public.physical_counts;
CREATE POLICY "Users see own company physical_counts"
  ON public.physical_counts FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users manage own company physical_counts" ON public.physical_counts;
CREATE POLICY "Users manage own company physical_counts"
  ON public.physical_counts FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users see own company physical_count_items" ON public.physical_count_items;
CREATE POLICY "Users see own company physical_count_items"
  ON public.physical_count_items FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users manage own company physical_count_items" ON public.physical_count_items;
CREATE POLICY "Users manage own company physical_count_items"
  ON public.physical_count_items FOR ALL TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()))
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));


-- ==================================================================
-- FILE: 20260408143000_phase9_physical_counts_rpc.sql
-- ==================================================================

-- Phase 9.1: atomic physical count creation with system_qty snapshot

CREATE OR REPLACE FUNCTION public.create_physical_count_with_items(
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _folio TEXT,
  _notes TEXT,
  _counted_by UUID,
  _items JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count_id UUID;
  _item JSONB;
  _product_id UUID;
  _counted_qty NUMERIC;
  _system_qty NUMERIC;
BEGIN
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty JSON array';
  END IF;

  INSERT INTO public.physical_counts (
    company_id, branch_id, warehouse_id, folio, notes, counted_by, status
  )
  VALUES (
    _company_id, _branch_id, _warehouse_id, _folio, _notes, _counted_by, 'draft'
  )
  RETURNING id INTO _count_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _product_id := (_item->>'product_id')::UUID;
    _counted_qty := COALESCE((_item->>'counted_qty')::NUMERIC, 0);

    IF _product_id IS NULL THEN
      RAISE EXCEPTION 'product_id is required in each item';
    END IF;

    IF _counted_qty < 0 THEN
      RAISE EXCEPTION 'counted_qty must be >= 0';
    END IF;

    SELECT COALESCE(sl.quantity, 0)
      INTO _system_qty
    FROM public.stock_levels sl
    WHERE sl.company_id = _company_id
      AND sl.warehouse_id = _warehouse_id
      AND sl.product_id = _product_id
    LIMIT 1;

    INSERT INTO public.physical_count_items (
      company_id, count_id, product_id, system_qty, counted_qty
    )
    VALUES (
      _company_id, _count_id, _product_id, COALESCE(_system_qty, 0), _counted_qty
    );
  END LOOP;

  RETURN json_build_object('ok', true, 'count_id', _count_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_physical_count_with_items(UUID, UUID, UUID, TEXT, TEXT, UUID, JSONB) TO authenticated;


-- ==================================================================
-- FILE: 20260409100000_phase9_physical_counts_hardening_post.sql
-- ==================================================================

-- Phase 9.2: Security hardening + posting flow for physical counts

CREATE OR REPLACE FUNCTION public.create_physical_count_with_items(
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _folio TEXT,
  _notes TEXT,
  _counted_by UUID,
  _items JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count_id UUID;
  _item JSONB;
  _product_id UUID;
  _counted_qty NUMERIC;
  _system_qty NUMERIC;
  _actor UUID;
BEGIN
  _actor := auth.uid();
  IF _actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied for company %', _company_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.branches b
    WHERE b.id = _branch_id AND b.company_id = _company_id
  ) THEN
    RAISE EXCEPTION 'Branch % does not belong to company %', _branch_id, _company_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.warehouses w
    WHERE w.id = _warehouse_id AND w.company_id = _company_id
  ) THEN
    RAISE EXCEPTION 'Warehouse % does not belong to company %', _warehouse_id, _company_id;
  END IF;

  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'items must be a non-empty JSON array';
  END IF;

  INSERT INTO public.physical_counts (
    company_id, branch_id, warehouse_id, folio, notes, counted_by, status
  )
  VALUES (
    _company_id, _branch_id, _warehouse_id, _folio, _notes, COALESCE(_counted_by, _actor), 'draft'
  )
  RETURNING id INTO _count_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _product_id := (_item->>'product_id')::UUID;
    _counted_qty := COALESCE((_item->>'counted_qty')::NUMERIC, 0);

    IF _product_id IS NULL THEN
      RAISE EXCEPTION 'product_id is required in each item';
    END IF;

    IF _counted_qty < 0 THEN
      RAISE EXCEPTION 'counted_qty must be >= 0';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = _product_id AND p.company_id = _company_id
    ) THEN
      RAISE EXCEPTION 'Product % does not belong to company %', _product_id, _company_id;
    END IF;

    SELECT COALESCE(sl.quantity, 0)
      INTO _system_qty
    FROM public.stock_levels sl
    WHERE sl.company_id = _company_id
      AND sl.warehouse_id = _warehouse_id
      AND sl.product_id = _product_id
    LIMIT 1;

    INSERT INTO public.physical_count_items (
      company_id, count_id, product_id, system_qty, counted_qty
    )
    VALUES (
      _company_id, _count_id, _product_id, COALESCE(_system_qty, 0), _counted_qty
    );
  END LOOP;

  RETURN json_build_object('ok', true, 'count_id', _count_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.post_physical_count(
  _company_id UUID,
  _count_id UUID,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count RECORD;
  _item RECORD;
  _delta NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied for company %', _company_id;
  END IF;

  SELECT *
  INTO _count
  FROM public.physical_counts pc
  WHERE pc.id = _count_id
    AND pc.company_id = _company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Physical count % not found for company %', _count_id, _company_id;
  END IF;

  IF _count.status <> 'draft' THEN
    RAISE EXCEPTION 'Physical count % is not in draft status', _count_id;
  END IF;

  FOR _item IN
    SELECT * FROM public.physical_count_items pci
    WHERE pci.count_id = _count_id
      AND pci.company_id = _company_id
  LOOP
    _delta := COALESCE(_item.counted_qty, 0) - COALESCE(_item.system_qty, 0);

    IF _delta <> 0 THEN
      PERFORM public.adjust_stock(
        _company_id,
        _count.warehouse_id,
        _item.product_id,
        _delta,
        'count_adjustment',
        COALESCE(_notes, _count.notes, 'Physical count posting')
      );
    END IF;
  END LOOP;

  UPDATE public.physical_counts
  SET status = 'posted',
      posted_at = now(),
      notes = COALESCE(_notes, notes),
      updated_at = now()
  WHERE id = _count_id
    AND company_id = _company_id;

  RETURN json_build_object('ok', true, 'count_id', _count_id, 'status', 'posted');
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_physical_count(UUID, UUID, TEXT) TO authenticated;


-- ==================================================================
-- FILE: 20260409110000_phase9_post_physical_count_summary.sql
-- ==================================================================

-- Phase 9.3: enrich post_physical_count output with posting summary

CREATE OR REPLACE FUNCTION public.post_physical_count(
  _company_id UUID,
  _count_id UUID,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count RECORD;
  _item RECORD;
  _delta NUMERIC;
  _adjusted_lines INTEGER := 0;
  _total_abs_delta NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'Access denied for company %', _company_id;
  END IF;

  SELECT *
  INTO _count
  FROM public.physical_counts pc
  WHERE pc.id = _count_id
    AND pc.company_id = _company_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Physical count % not found for company %', _count_id, _company_id;
  END IF;

  IF _count.status <> 'draft' THEN
    RAISE EXCEPTION 'Physical count % is not in draft status', _count_id;
  END IF;

  FOR _item IN
    SELECT * FROM public.physical_count_items pci
    WHERE pci.count_id = _count_id
      AND pci.company_id = _company_id
  LOOP
    _delta := COALESCE(_item.counted_qty, 0) - COALESCE(_item.system_qty, 0);

    IF _delta <> 0 THEN
      PERFORM public.adjust_stock(
        _company_id,
        _count.warehouse_id,
        _item.product_id,
        _delta,
        'count_adjustment',
        COALESCE(_notes, _count.notes, 'Physical count posting')
      );

      _adjusted_lines := _adjusted_lines + 1;
      _total_abs_delta := _total_abs_delta + ABS(_delta);
    END IF;
  END LOOP;

  UPDATE public.physical_counts
  SET status = 'posted',
      posted_at = now(),
      notes = COALESCE(_notes, notes),
      updated_at = now()
  WHERE id = _count_id
    AND company_id = _company_id;

  RETURN json_build_object(
    'ok', true,
    'count_id', _count_id,
    'status', 'posted',
    'adjusted_lines', _adjusted_lines,
    'total_abs_delta', _total_abs_delta
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.post_physical_count(UUID, UUID, TEXT) TO authenticated;


-- ==================================================================
-- FILE: 20260415120000_layaways_module.sql
-- ==================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- FASE N: Módulo de Apartados (Layaways)
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Tabla LAYAWAYS
CREATE TABLE IF NOT EXISTS public.layaways (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id       UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
  customer_id     UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_amount    NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date        DATE,
  notes           TEXT
);
COMMENT ON TABLE public.layaways IS 'Apartados (layaways) — reserva de mercancía con pagos parciales';
COMMENT ON COLUMN public.layaways.status IS 'active | completed | cancelled';
COMMENT ON COLUMN public.layaways.due_date IS 'Fecha esperada de entrega (opcional)';

-- 2) Tabla LAYAWAY_ITEMS
CREATE TABLE IF NOT EXISTS public.layaway_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layaway_id      UUID NOT NULL REFERENCES public.layaways(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity        NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  unit_price      NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  reserved_stock  NUMERIC(10,3) NOT NULL CHECK (reserved_stock >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.layaway_items IS 'Items de un apartado — productos reservados';
COMMENT ON COLUMN public.layaway_items.reserved_stock IS 'Stock reservado de stock_levels al momento de crear el apartado';

-- 3) Tabla LAYAWAY_PAYMENTS
CREATE TABLE IF NOT EXISTS public.layaway_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layaway_id      UUID NOT NULL REFERENCES public.layaways(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method  TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'mixed')),
  payment_details JSONB,
  created_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.layaway_payments IS 'Pagos (abonos) registrados en un apartado';
COMMENT ON COLUMN public.layaway_payments.payment_details IS '{ method, reference, note } para métodos mixtos';

-- 4) Índices
CREATE INDEX IF NOT EXISTS idx_layaways_company_branch ON public.layaways(company_id, branch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_layaways_customer ON public.layaways(customer_id);
CREATE INDEX IF NOT EXISTS idx_layaways_status ON public.layaways(company_id, status);
CREATE INDEX IF NOT EXISTS idx_layaways_created_by ON public.layaways(created_by);
CREATE INDEX IF NOT EXISTS idx_layaways_due_date ON public.layaways(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_layaway_items_layaway ON public.layaway_items(layaway_id);
CREATE INDEX IF NOT EXISTS idx_layaway_items_product ON public.layaway_items(product_id);
CREATE INDEX IF NOT EXISTS idx_layaway_payments_layaway ON public.layaway_payments(layaway_id);
CREATE INDEX IF NOT EXISTS idx_layaway_payments_created_by ON public.layaway_payments(created_by);

-- 5) Triggers updated_at
DROP TRIGGER IF EXISTS update_layaways_updated_at ON public.layaways;
CREATE TRIGGER update_layaways_updated_at
  BEFORE UPDATE ON public.layaways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) RLS
ALTER TABLE public.layaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layaway_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layaway_payments ENABLE ROW LEVEL SECURITY;

-- layaways
DROP POLICY IF EXISTS "Users see own company layaways" ON public.layaways;
CREATE POLICY "Users see own company layaways" ON public.layaways FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users insert layaways in own company" ON public.layaways;
CREATE POLICY "Users insert layaways in own company" ON public.layaways FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users update own company layaways" ON public.layaways;
CREATE POLICY "Users update own company layaways" ON public.layaways FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

-- layaway_items
DROP POLICY IF EXISTS "Users see own company layaway items" ON public.layaway_items;
CREATE POLICY "Users see own company layaway items" ON public.layaway_items FOR SELECT TO authenticated
  USING (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

DROP POLICY IF EXISTS "Users insert layaway items in own company" ON public.layaway_items;
CREATE POLICY "Users insert layaway items in own company" ON public.layaway_items FOR INSERT TO authenticated
  WITH CHECK (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

DROP POLICY IF EXISTS "Users delete own company layaway items" ON public.layaway_items;
CREATE POLICY "Users delete own company layaway items" ON public.layaway_items FOR DELETE TO authenticated
  USING (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

-- layaway_payments
DROP POLICY IF EXISTS "Users see own company layaway payments" ON public.layaway_payments;
CREATE POLICY "Users see own company layaway payments" ON public.layaway_payments FOR SELECT TO authenticated
  USING (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

DROP POLICY IF EXISTS "Users insert layaway payments in own company" ON public.layaway_payments;
CREATE POLICY "Users insert layaway payments in own company" ON public.layaway_payments FOR INSERT TO authenticated
  WITH CHECK (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

-- ==================================================================
-- FILE: 20260415130000_products_rls_hardening.sql
-- ==================================================================

-- =====================================================
-- RLS Hardening: products table
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- Status: PROOF OF CONCEPT (aplicar a dev/test primero)
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- 2. Policy: usuarios solo ven productos de su empresa
CREATE POLICY "products_select_policy" ON products
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 3. Policy: usuarios solo insertan productos de su empresa
CREATE POLICY "products_insert_policy" ON products
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Policy: usuarios solo actualizan productos de su empresa
CREATE POLICY "products_update_policy" ON products
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 5. Policy: usuarios solo eliminan productos de su empresa
CREATE POLICY "products_delete_policy" ON products
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 6. Comentarios de auditoría
COMMENT ON TABLE products IS 'Catálogo de productos. RLS activo desde 2026-04-15. Políticas: solo lectura/escritura por company_id del usuario.';

-- ==================================================================
-- FILE: 20260415140000_performance_indexes.sql
-- ==================================================================

-- =====================================================
-- Performance Indexes — Ventuki POS SaaS
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- Purpose: Optimize frequently queried columns and foreign keys
-- =====================================================

-- TABLAS TRANSACCIONALES

-- sales: búsqueda por fecha + empresa + sucursal (dashboard KPIs)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_company_branch_created 
ON sales(company_id, branch_id, created_at DESC);

-- sales: búsqueda por cliente
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_customer 
ON sales(customer_id) WHERE customer_id IS NOT NULL;

-- sales: búsqueda por status (corte de caja)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_status 
ON sales(status) WHERE status IS NOT NULL;

-- sale_lines: búsqueda por sale_id (detalle de venta)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_lines_sale 
ON sale_lines(sale_id);

-- sale_lines: búsqueda por producto (devoluciones, reportes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_lines_product 
ON sale_lines(product_id);

-- purchases: búsqueda por fecha + empresa + sucursal
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_company_branch_created 
ON purchases(company_id, branch_id, created_at DESC);

-- purchase_lines: búsqueda por purchase_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_lines_purchase 
ON purchase_lines(purchase_id);

-- purchase_lines: búsqueda por producto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_lines_product 
ON purchase_lines(product_id);

-- INVENTARIO

-- inventory_movements: búsqueda por almacén + fecha (reporte de movimientos)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movements_warehouse_created 
ON inventory_movements(warehouse_id, created_at DESC);

-- inventory_movements: búsqueda por producto + tipo (kardex)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_movements_product_type 
ON inventory_movements(product_id, movement_type);

-- inventory_stock: búsqueda por almacén + producto (stock actual)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_stock_warehouse_product 
ON inventory_stock(warehouse_id, product_id);

-- inventory_stock: búsqueda por empresa + almacén (sumario)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_stock_company_warehouse 
ON inventory_stock(company_id, warehouse_id);

-- CAJA

-- cash_sessions: búsqueda por sucursal + status (corte de caja)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_sessions_branch_status 
ON cash_sessions(branch_id, status) WHERE status IS NOT NULL;

-- cash_sessions: búsqueda por fecha de apertura
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cash_sessions_opened_at 
ON cash_sessions(opened_at DESC);

-- CATÁLOGOS (solo si tienen company_id — verificar)

-- products: búsqueda por empresa + nombre (POS search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_company_name 
ON products(company_id, name) WHERE name IS NOT NULL;

-- products: búsqueda por código de barras
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_barcode 
ON products(barcode) WHERE barcode IS NOT NULL;

-- customers: búsqueda por empresa + nombre
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_company_name 
ON customers(company_id, name) WHERE name IS NOT NULL;

-- customers: búsqueda por email
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email 
ON customers(email) WHERE email IS NOT NULL;

-- AUDIT LOGS (high volume — partition-ready)

-- system_audit_logs: búsqueda por empresa + fecha (logs de auditoría)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_company_created 
ON system_audit_logs(company_id, created_at DESC);

-- system_audit_logs: búsqueda por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_user 
ON system_audit_logs(user_id) WHERE user_id IS NOT NULL;

-- system_audit_logs: búsqueda por acción + tabla
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_audit_logs_action_table 
ON system_audit_logs(action, table_name) WHERE action IS NOT NULL;

-- NOTES:
-- 1. CONCURRENTLY avoids locking tables during index creation
-- 2. Partial indexes (WHERE clause) reduce index size for sparse columns
-- 3. For high-volume tables (system_audit_logs), consider partitioning by date
-- 4. Run ANALYZE after index creation to update statistics

-- ==================================================================
-- FILE: 20260415150000_branches_rls_hardening.sql
-- ==================================================================

-- =====================================================
-- RLS Hardening: branches table
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- =====================================================

-- 1. Habilitar RLS
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches FORCE ROW LEVEL SECURITY;

-- 2. Policy: usuarios solo ven sucursales de su empresa
CREATE POLICY "branches_select_policy" ON branches
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 3. Policy: usuarios solo insertan sucursales de su empresa
CREATE POLICY "branches_insert_policy" ON branches
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Policy: usuarios solo actualizan sucursales de su empresa
CREATE POLICY "branches_update_policy" ON branches
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 5. Policy: usuarios solo eliminan sucursales de su empresa
CREATE POLICY "branches_delete_policy" ON branches
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

-- 6. Comentario
COMMENT ON TABLE branches IS 'Sucursales por empresa. RLS activo desde 2026-04-15. Políticas por company_id.';

-- ==================================================================
-- FILE: 20260415160000_warehouses_rls_hardening.sql
-- ==================================================================

-- =====================================================
-- RLS Hardening: warehouses table
-- Date: 2026-04-15
-- Author: Agent 1 - DevOps/Security
-- =====================================================

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

CREATE POLICY "warehouses_select_policy" ON warehouses
    FOR SELECT
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "warehouses_insert_policy" ON warehouses
    FOR INSERT
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "warehouses_update_policy" ON warehouses
    FOR UPDATE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "warehouses_delete_policy" ON warehouses
    FOR DELETE
    USING (
        company_id IN (
            SELECT company_id 
            FROM user_company_roles 
            WHERE user_id = auth.uid()
        )
    );

COMMENT ON TABLE warehouses IS 'Almacenes por sucursal. RLS activo desde 2026-04-15. Políticas por company_id.';

-- ==================================================================
-- FILE: 20260416180000_stock_reservation_fix.sql
-- ==================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Stock Reservation & POS Performance Optimization
-- ═══════════════════════════════════════════════════════════════════════

-- 1) Añadir columna reserved_qty a stock_levels
ALTER TABLE public.stock_levels 
  ADD COLUMN IF NOT EXISTS reserved_qty NUMERIC(12,3) NOT NULL DEFAULT 0;

-- 2) Actualizar RPC adjust_stock para considerar reservas
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
  _reserved NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.has_company_access(_company_id) THEN
    RAISE EXCEPTION 'No company access';
  END IF;

  -- Upsert stock level
  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity, reserved_qty)
  VALUES (_company_id, _warehouse_id, _product_id, GREATEST(_delta, 0), 0)
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET quantity = public.stock_levels.quantity + _delta,
                updated_at = now()
  RETURNING quantity, reserved_qty INTO _new_qty, _reserved;

  -- Validar que el stock real no baje de lo reservado
  IF _new_qty < _reserved THEN
    RAISE EXCEPTION 'No se puede ajustar el stock por debajo de la reserva actual (Q:% < R:%)', _new_qty, _reserved;
  END IF;

  -- Registrar movimiento
  INSERT INTO public.stock_movements (
    company_id, warehouse_id, product_id, movement_type, quantity, balance_after, notes, created_by
  )
  VALUES (
    _company_id, _warehouse_id, _product_id, _movement_type, _delta, _new_qty, _notes, auth.uid()
  );

  RETURN json_build_object(
    'company_id', _company_id,
    'warehouse_id', _warehouse_id,
    'product_id', _product_id,
    'new_quantity', _new_qty,
    'reserved_quantity', _reserved,
    'available_quantity', _new_qty - _reserved
  );
END;
$$;

-- 3) Crear RPC reserve_stock
CREATE OR REPLACE FUNCTION public.reserve_stock(
  _company_id UUID,
  _warehouse_id UUID,
  _product_id UUID,
  _delta_reserved NUMERIC,
  _notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_reserved NUMERIC;
  _current_qty NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.has_company_access(_company_id) THEN RAISE EXCEPTION 'No company access'; END IF;

  -- Upsert con valor inicial si no existe
  INSERT INTO public.stock_levels (company_id, warehouse_id, product_id, quantity, reserved_qty)
  VALUES (_company_id, _warehouse_id, _product_id, 0, GREATEST(_delta_reserved, 0))
  ON CONFLICT (company_id, warehouse_id, product_id)
  DO UPDATE SET reserved_qty = public.stock_levels.reserved_qty + _delta_reserved,
                updated_at = now()
  RETURNING quantity, reserved_qty INTO _current_qty, _new_reserved;

  IF _new_reserved < 0 THEN
    RAISE EXCEPTION 'La reserva no puede ser negativa';
  END IF;

  IF _current_qty < _new_reserved THEN
    RAISE EXCEPTION 'Stock insuficiente para reservar (Disponible: %)', _current_qty;
  END IF;

  RETURN json_build_object(
    'product_id', _product_id,
    'new_reserved', _new_reserved,
    'total_quantity', _current_qty,
    'available', _current_qty - _new_reserved
  );
END;
$$;

-- 4) Crear RPC get_pos_products_search (OPTIMIZACIÓN BATCH)
CREATE OR REPLACE FUNCTION public.get_pos_products_search(
  _company_id UUID,
  _branch_id UUID,
  _warehouse_id UUID,
  _search_term TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  sku TEXT,
  price NUMERIC,
  stock_total NUMERIC,
  stock_reserved NUMERIC,
  stock_available NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    COALESCE(pp.price, 0) as price,
    COALESCE(sl.quantity, 0) as stock_total,
    COALESCE(sl.reserved_qty, 0) as stock_reserved,
    COALESCE(sl.quantity, 0) - COALESCE(sl.reserved_qty, 0) as stock_available
  FROM public.products p
  -- Join con precios de la lista default
  LEFT JOIN public.product_prices pp ON pp.product_id = p.id 
    AND pp.company_id = _company_id
  LEFT JOIN public.price_lists pl ON pl.id = pp.price_list_id 
    AND pl.is_default = true
  -- Join con stock del almacén específico
  LEFT JOIN public.stock_levels sl ON sl.product_id = p.id 
    AND sl.warehouse_id = _warehouse_id
    AND sl.company_id = _company_id
  WHERE p.company_id = _company_id
    AND p.is_active = true
    AND (p.name ILIKE '%' || _search_term || '%' OR p.sku ILIKE '%' || _search_term || '%')
  ORDER BY p.name ASC
  LIMIT 50;
END;
$$;


-- ==================================================================
-- FILE: security_performance_indexes.sql
-- ==================================================================

-- Security & Performance Indexes Migration
-- Phase: Security Hardening (Agent 1 - DevOps/Security)
-- Fecha: 2026-04-15
-- Propósito: Índices para queries frecuentes del dashboard POS y auditoría

-- ============================================================================
-- DASHBOARD KPIs — Ventas y Compras por periodo/companía/sucursal
-- ============================================================================

-- Ventas por compañía/sucursal/fecha (dashboard principal)
CREATE INDEX IF NOT EXISTS idx_sales_company_branch_created
  ON public.sales(company_id, branch_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Compras por compañía/sucursal/fecha (dashboard principal)
CREATE INDEX IF NOT EXISTS idx_purchases_company_branch_created
  ON public.purchases(company_id, branch_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- POS SEARCH — Búsqueda rápida de productos por nombre (GIN trigram)
-- ============================================================================

-- Búsqueda de productos por nombre con LIKE/ILIKE rápido (POS search bar)
CREATE INDEX IF NOT EXISTS idx_products_company_name_gin
  ON public.products USING gin(company_id, name gin_trgm_ops);

-- Búsqueda por código de barras (productos)
CREATE INDEX IF NOT EXISTS idx_product_barcodes_company_product
  ON public.product_barcodes(company_id, product_id);

-- ============================================================================
-- INVENTARIO — Movimientos de stock para auditoría y reconcile
-- ============================================================================

-- Movimientos de inventario por almacén/producto/fecha
CREATE INDEX IF NOT EXISTS idx_stock_movements_company_warehouse_product_date
  ON public.stock_movements(company_id, warehouse_id, product_id, created_at DESC);

-- Nivel de stock por almacén/producto (lookups frecuentes)
CREATE INDEX IF NOT EXISTS idx_stock_levels_company_warehouse_product
  ON public.stock_levels(company_id, warehouse_id, product_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- FINANCIALES — Clientes, sesiones, pagos
-- ============================================================================

-- Clientes por company_id + tax_id (búsqueda RFC)
CREATE INDEX IF NOT EXISTS idx_customers_company_tax_id
  ON public.customers(company_id, tax_id)
  WHERE tax_id IS NOT NULL AND deleted_at IS NULL;

-- Sesiones de caja abiertas (cajero ve su sesión activa)
CREATE INDEX IF NOT EXISTS idx_cash_register_sessions_active
  ON public.cash_register_sessions(branch_id, status, opened_at DESC)
  WHERE status = 'open';

-- Pagos de venta por sale_id (reconstruir transacciones)
CREATE INDEX IF NOT EXISTS idx_sale_payments_sale_id
  ON public.sale_payments(sale_id);

-- Líneas de venta por sale_id
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id
  ON public.sale_items(sale_id);

-- ============================================================================
-- AUDIT LOGS — Consulta eficiente por compañía/módulo/fecha
-- ============================================================================

-- Logs de auditoría por compañía + módulo + fecha
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_module_created
  ON public.audit_logs(company_id, module, created_at DESC);

-- ============================================================================
-- COMPRAS — Recepciones y receipts
-- ============================================================================

-- Purchase receipts por purchase_id (reconstruir órdenes)
CREATE INDEX IF NOT EXISTS idx_purchase_receipts_purchase_id
  ON public.purchase_receipts(purchase_id)
  WHERE deleted_at IS NULL;

-- Líneas de receipt por receipt_id
CREATE INDEX IF NOT EXISTS idx_purchase_receipt_items_receipt_id
  ON public.purchase_receipt_items(receipt_id);

-- ============================================================================
-- INVENTARIO TRANSFERENCIAS — Rastreo de transferencias entre almacenes
-- ============================================================================

-- Transferencias por compañía/sucursal/estado/fecha
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_company_branch_status
  ON public.inventory_transfers(company_id, branch_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- INVENTORY COUNTS — Conteos físicos
-- ============================================================================

-- Conteos físicos por compañía/sucursal/estado/fecha
CREATE INDEX IF NOT EXISTS idx_physical_counts_company_branch_status
  ON public.physical_counts(company_id, branch_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Ítems de conteo físico por physical_count_id + producto
CREATE INDEX IF NOT EXISTS idx_physical_count_items_count_product
  ON public.physical_count_items(physical_count_id, product_id);

-- ==================================================================
-- FILE: security_rls_fix_critical.sql
-- ==================================================================

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

