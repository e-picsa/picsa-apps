alter table public.translations
rename column en to text
add archived boolean
;
comment on column public.translations.archived is 'Specify whether translation string has been archived (retained for future use)';