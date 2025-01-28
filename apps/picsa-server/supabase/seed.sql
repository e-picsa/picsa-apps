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