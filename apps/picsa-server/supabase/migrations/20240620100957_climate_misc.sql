-- Enforce non-null country_code for deployment
alter table public.deployments
alter column country_code set not null;


