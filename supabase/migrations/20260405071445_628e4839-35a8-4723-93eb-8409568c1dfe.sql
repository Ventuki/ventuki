
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
