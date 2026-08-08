-- Allow maturity_period to be NULL in public.crop_data
ALTER TABLE public.crop_data ALTER COLUMN maturity_period DROP NOT NULL;
