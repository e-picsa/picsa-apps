-- Create user_profiles table
CREATE TABLE "public"."user_profiles" (
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "full_name" text,
  "organisation" text,
  "country_code" text,
  PRIMARY KEY ("user_id")
);

-- Enable RLS
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON "public"."user_profiles"
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON "public"."user_profiles"
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON "public"."user_profiles"
  FOR SELECT TO authenticated USING (public.user_is_global_admin());

-- Trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, organisation, country_code)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'organisation',
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'global')
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    organisation = EXCLUDED.organisation,
    country_code = COALESCE(EXCLUDED.country_code, public.user_profiles.country_code);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Auth.users trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Backfill existing users
INSERT INTO public.user_profiles (user_id, full_name, organisation, country_code)
SELECT
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'organisation',
  COALESCE(raw_user_meta_data->>'country_code', 'global')
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  organisation = EXCLUDED.organisation,
  country_code = COALESCE(EXCLUDED.country_code, public.user_profiles.country_code);