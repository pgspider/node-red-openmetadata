CREATE EXTENSION pg_stat_statements;

CREATE TABLE ft1 (i int);
CREATE TABLE ft2 (i int, j int);
CREATE TABLE ft3 (c1 int, c2 text);
CREATE TABLE ft4 (c1 int, c2 int, c3 text);
CREATE TABLE ft5 (c1 text, c2 timestamptz);

CREATE SCHEMA schema1;
CREATE SCHEMA schema2;
