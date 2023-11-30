-- Use Postgres to create a bucket.

insert into storage.buckets (id, name, public)
values ('resources',
        'resources',
        true);