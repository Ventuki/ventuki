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
