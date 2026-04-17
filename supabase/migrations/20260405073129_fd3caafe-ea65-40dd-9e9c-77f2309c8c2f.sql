
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
