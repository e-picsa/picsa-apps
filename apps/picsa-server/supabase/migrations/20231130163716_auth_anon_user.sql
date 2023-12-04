-- https://github.com/orgs/supabase/discussions/5248
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
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'anonymous_user@picsa.app',
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    crypt('anonymous_user@picsa.app', gen_salt('bf')),
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