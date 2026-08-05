-- RLS policies for Admins on public.user_profiles
CREATE POLICY "Admins can update all profiles" ON "public"."user_profiles"
  FOR UPDATE TO authenticated USING (public.user_is_global_admin());

CREATE POLICY "Admins can insert all profiles" ON "public"."user_profiles"
  FOR INSERT TO authenticated WITH CHECK (public.user_is_global_admin());
