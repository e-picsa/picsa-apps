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

-- Assign the deterministic local anon_key so call_edge_function can bypass Kong API Gateway
select vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  'anon_key',
  'supabase local anon key'
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
    jsonb_build_object(
      'sub', '00000000-0000-0000-0000-000000000000',
      'email', 'admin@picsa.app',
      'email_verified', true
    ),
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

-- Add identity for email provider
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    jsonb_build_object(
        'sub', '00000000-0000-0000-0000-000000000000',
        'email', 'admin@picsa.app',
        'email_verified', true
    ),
    'email',
    '00000000-0000-0000-0000-000000000000',
    NOW(),
    NOW(),
    NOW()
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