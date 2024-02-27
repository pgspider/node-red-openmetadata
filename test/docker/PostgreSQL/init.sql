CREATE DATABASE test2;
CREATE DATABASE test_postgres;
GRANT ALL PRIVILEGES ON DATABASE test2 TO postgres;
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
GRANT ALL PRIVILEGES ON DATABASE test_postgres TO postgres;


\c test2
CREATE EXTENSION pg_stat_statements;
Create table ptable1 (I int);
Create table ptable2 (c1 int, c2 int);
Create table ptable3 (c1 int NOT NULL, c2 int NOT NULL);
Create table ptable4 (c1 text);
Create table ptable5 (c1 bigint,c2 bigserial, c3 bit (10) , c4 varbit (10), c5 bool); 
CREATE SCHEMA schema3;
CREATE SCHEMA schema4;

\c postgres
CREATE EXTENSION pg_stat_statements;
Create table ptable1 (I int);
Create table ptable2 (c1 int, c2 int);
Create table ptable3 (c1 int NOT NULL, c2 int NOT NULL);
Create table ptable4 (c1 text);
Create table ptable5 (c1 bigint,c2 bigserial, c3 bit (10) , c4 varbit (10), c5 bool); 
CREATE SCHEMA schema3;
CREATE SCHEMA schema4;

\c test_postgres
CREATE EXTENSION pg_stat_statements;
Create table ptable1 (I int);
Create table ptable2 (c1 int, c2 int);
Create table ptable3 (c1 int NOT NULL, c2 int NOT NULL);
Create table ptable4 (c1 text);
Create table ptable5 (c1 bigint,c2 bigserial, c3 bit (10) , c4 varbit (10), c5 bool); 
CREATE SCHEMA schema3;
CREATE SCHEMA schema4;
