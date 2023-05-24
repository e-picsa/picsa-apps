-- migrate:up

create table users ( id integer, name varchar(255), email varchar(255) not null);

-- migrate:down