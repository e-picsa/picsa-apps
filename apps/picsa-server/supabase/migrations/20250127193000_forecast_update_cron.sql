-- enable pg_cron extension
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Trigger backend edge function every 30 minutes
-- Adapted from https://supabase.com/docs/guides/functions/schedule-functions

select cron.schedule('climate_forecasts_update', '30 * * * *', $$ select public.call_edge_function('dashboard/climate-forecast-update','{}'::jsonb); $$);


-- Alt implementation (intermediate function created to structure more complex requests, kept for future reference)

-- create or replace function public.trigger_climate_forecast_update() 
-- returns void
-- language plpgsql 
-- as $$ 
-- declare
--     body jsonb;
--     request_id bigint;
--     request_ids BIGINT[] = array[]::BIGINT[];
--     country_codes text[] = array['mw','zm'];
--     country_code text;
-- begin 
--  foreach country_code in array country_codes loop
--     body = format('{"country_code": "%s"}',country_code)::jsonb;
--     select (public.call_edge_function('dashboard/climate-forecast-update',body)) into request_id;
--     request_ids = request_ids || request_id;    
--   end loop;
--   return 'request_ids';
-- end $$; 


                                                                    ^

