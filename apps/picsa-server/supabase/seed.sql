-- CC note - copy csv not supported in supabase
-- https://github.com/orgs/supabase/discussions/9314

-- COPY climate_stations FROM 'data/climate_stations_rows.csv' WITH (FORMAT csv);

-- Assign the local docker project-url for use in functions
-- NOTE - should be manually set on production
select vault.create_secret(
  'http://host.docker.internal:54321',
  'project_url',
  'supabase project url'
);


-- Storage Buckets
insert into storage.buckets (id, name, public) values
  ('global', 'global', true),
  ('mw', 'mw', true),
  ('zm', 'zm', true);


-- Add initial seed auth users
-- https://github.com/orgs/supabase/discussions/5248

-- Admin User
INSERT INTO
  auth.users (
    id,
    instance_id,
    ROLE,
    aud,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    encrypted_password,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@picsa.app',
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    crypt('admin@picsa.app', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

-- Basic User
  INSERT INTO
  auth.users (
    id,
    instance_id,
    ROLE,
    aud,
    email,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    encrypted_password,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
VALUES
  (
    '10000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user@picsa.app',
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    crypt('user@picsa.app', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );