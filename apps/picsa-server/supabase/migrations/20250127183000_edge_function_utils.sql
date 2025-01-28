-- enable the "pg_net" extension.
create extension if not exists pg_net;


-- https://github.com/orgs/supabase/discussions/12813

create schema private; -- to avoid this function in the API

-- utility to retrieve values stored within supabase vault
CREATE OR REPLACE FUNCTION private.get_secret (secret_name text)
RETURNS TEXT
SECURITY definer
SET search_path = ''
AS
$$ 
DECLARE 
   secret text;
BEGIN
   SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = secret_name;
   RETURN secret;
END;
$$ language plpgsql;

-- utility to call a named supabase edge function (post request with body)
CREATE OR REPLACE FUNCTION public.call_edge_function(name text, body jsonb)
 RETURNS BIGINT
 LANGUAGE plpgsql
AS $function$
DECLARE
    project_url TEXT;
    full_url TEXT;
    request_id BIGINT;
BEGIN
    -- Fetch the project URL
    project_url := private.get_secret('project_url');

    -- Construct the full URL
    full_url := project_url || '/functions/v1/' || name;

    -- Call the http_request function with the constructed URL
    select (net.http_post(
        url := full_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || private.get_secret('anon_key')
        ),
        body := body,
        timeout_milliseconds := 30000
    )) into request_id;

    return request_id;

END;
$function$
;

-- SELECT public.call_edge_function('my_edge_function', '{}'::jsonb);

-- select * from net._http_response order by id desc limit 5;

