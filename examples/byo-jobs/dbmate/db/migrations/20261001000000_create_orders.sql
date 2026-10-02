-- migrate:up
create table if not exists orders (id serial primary key, item text not null);
insert into orders (item) values ('tea');

-- migrate:down
drop table orders;
