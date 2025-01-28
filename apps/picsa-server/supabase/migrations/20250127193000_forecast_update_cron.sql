-- enable pg_cron extension
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- enable the "pg_net" extension.
create extension if not exists pg_net;

-- Create function to trigger functions endoint for specific country codes
-- https://supabase.com/docs/guides/functions/schedule-functions
create or replace function public.climate_forecast_update() 
returns bigint[] 
language plpgsql 
as $$ 

declare
    body jsonb;
    request_id bigint;
    request_ids BIGINT[] = array[]::BIGINT[];
    -- TODO - lookup from db
    country_codes text[] = array['mw','zm'];
    country_code text;

begin 
 foreach country_code in array country_codes loop
    body = format('{"country_code": "%s"}',country_code)::jsonb;
    select (public.call_edge_function('dashboard/climate-forecast-update',body)) into request_id;
    request_ids = request_ids || request_id;    
  end loop;
  -- Requests will be handled asynchronously, so for now just return callback list of ids triggered   
  return 'request_ids';
end $$; 


-- Trigger to run every hour at the 30 minute mark
select cron.schedule('climate_forecasts_update', '30 * * * *', 'CALL climate_forecast_update()');

-- TODO - could maybe just use cron schedule and ignore individual country code lookups


-- Test via sql:
-- select public.climate_forecast_update();
-- (check for update)
-- select * from net._http_response order by id desc limit 5;

-- SELECT public.call_edge_function('dashboard/climate-forecast-update', '{"country_code":"mw"}'::jsonb);