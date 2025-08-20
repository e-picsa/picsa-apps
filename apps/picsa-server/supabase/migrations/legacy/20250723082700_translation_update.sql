alter table public.translations
add column mw_tum text;

alter table public.translations
add column updated_at timestamp with time zone;

--  NOTE - required extensions - allow moddatetime
create trigger handle_updated_at before update on public.translations
  for each row execute procedure moddatetime (updated_at);

