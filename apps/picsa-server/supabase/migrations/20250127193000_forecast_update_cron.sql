-- enable pg_cron extension
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- enable the "pg_net" extension.
create extension if not exists pg_net;

-- https://supabase.com/docs/guides/functions/schedule-functions
create or replace function public.climate_forecast_update() 
returns bigint 
language plpgsql 
as $$ 

declare
    -- url:='https://project-ref.supabase.co/functions/v1/function-name'
    url text ='http://host.docker.internal:54321/functions/v1/dashboard/climate-forecast-update';
    headers jsonb ='{"Content-Type": "application/json"}'::jsonb;
    body jsonb ='{"country_code": "mw"}'::jsonb;

    request_id BIGINT;
    -- TODO - lookup from db
    country_codes = ["mw","zm"]::text[]

begin 
    

    select (net.http_post(url:=url,headers:=headers,body:=body)) 
    into request_id;
    return request_id;

end $$; 


-- Trigger to run every hour at the 30 minute mark
select cron.schedule('climate_forecasts_update', '30 * * * *', 'CALL climate_forecast_update()');


-- Test via sql:
--select public.climate_forecast_update();
-- (check for update)
-- select * from net._http_response where id=xx;