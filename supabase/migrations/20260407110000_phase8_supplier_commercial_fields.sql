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
