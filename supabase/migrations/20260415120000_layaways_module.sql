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

DROP POLICY IF EXISTS "Users insert layaways in own company" ON public.layaways FOR INSERT TO authenticated
  WITH CHECK (company_id IN (SELECT public.get_user_company_ids()));

DROP POLICY IF EXISTS "Users update own company layaways" ON public.layaways FOR UPDATE TO authenticated
  USING (company_id IN (SELECT public.get_user_company_ids()));

-- layaway_items
DROP POLICY IF EXISTS "Users see own company layaway items" ON public.layaway_items FOR SELECT TO authenticated
  USING (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

DROP POLICY IF EXISTS "Users insert layaway items in own company" ON public.layaway_items FOR INSERT TO authenticated
  WITH CHECK (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

DROP POLICY IF EXISTS "Users delete own company layaway items" ON public.layaway_items FOR DELETE TO authenticated
  USING (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

-- layaway_payments
DROP POLICY IF EXISTS "Users see own company layaway payments" ON public.layaway_payments FOR SELECT TO authenticated
  USING (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));

DROP POLICY IF EXISTS "Users insert layaway payments in own company" ON public.layaway_payments FOR INSERT TO authenticated
  WITH CHECK (layaway_id IN (SELECT id FROM public.layaways WHERE company_id IN (SELECT public.get_user_company_ids())));