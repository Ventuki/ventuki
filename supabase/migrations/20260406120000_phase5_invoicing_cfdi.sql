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
