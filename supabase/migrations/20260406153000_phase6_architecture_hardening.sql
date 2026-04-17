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
