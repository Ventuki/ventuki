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
