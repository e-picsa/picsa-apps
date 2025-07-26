-- every month on the 1st at midnight, this will run the cleanup function
select cron.schedule(
  'forecast_cleanup',
  '0 0 1 * *', 
  $$ select public.call_edge_function('dashboard/forecast-cleanup','{}'::jsonb); $$
);

ALTER TYPE forecast_type ADD VALUE 'weekly';