-- Create user_profiles table
CREATE TABLE "public"."user_profiles" (
  "user_id" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  "full_name" text,
  "organisation" text,
  "country_code" text,
  "email_confirmed" boolean NOT NULL DEFAULT false;
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
  FOR SELECT TO authenticated USING (true);

-- Trigger function
-- Update handle_new_user to include email_confirmed
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, organisation, country_code, email_confirmed)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'organisation',
    COALESCE(NEW.raw_user_meta_data->>'country_code', 'global'),
    (NEW.email_confirmed_at IS NOT NULL)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    organisation = EXCLUDED.organisation,
    country_code = COALESCE(EXCLUDED.country_code, public.user_profiles.country_code),
    email_confirmed = EXCLUDED.email_confirmed;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle auth user updates (specifically email confirmation)
CREATE OR REPLACE FUNCTION public.handle_auth_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync email_confirmed status
  IF NEW.email_confirmed_at IS DISTINCT FROM OLD.email_confirmed_at THEN
    UPDATE public.user_profiles
    SET email_confirmed = (NEW.email_confirmed_at IS NOT NULL),
        updated_at = now()
    WHERE user_id = NEW.id;
  END IF;
  
  -- Sync metadata updates if they happen via auth api (less likely for us but good practice)
  -- Actually, let's keep it simple and just focus on email confirmation for now to avoid loops or conflicts
  -- if we were editing profile via metadata.
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_update();
