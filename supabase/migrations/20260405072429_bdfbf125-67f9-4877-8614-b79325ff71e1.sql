
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
