CREATE TABLE orders (
  id serial PRIMARY KEY,
  item text NOT NULL
);

INSERT INTO orders (item) VALUES ('tea');
