#! /bin/bash

DB1=test1
DB2=pgspider
DB3=test_pgspider
PGS_HOME=/home/pgspider/pgspider/install
PGS_USER=pgspider
PGS_PASSWORD=pgspider


echo $PGS_PASSWORD > $PGS_HOME/pwd.dat
# start database cluster
$PGS_HOME/bin/initdb --username="$PGS_USER" --pwfile=$PGS_HOME/pwd.dat ./testdb
sed -i "s/shared_preload_libraries =.*/shared_preload_libraries = 'pgspider_keepalive, pg_stat_statements'/g" ./testdb/postgresql.conf
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" ./testdb/postgresql.conf

echo  'host    all     all             172.16.240.0/24       trust' >> ./testdb/pg_hba.conf
echo  'host    all     all             127.0.0.0/24       trust' >> ./testdb/pg_hba.conf


$PGS_HOME/bin/pg_ctl -D ./testdb -l logfile start

# create test database
$PGS_HOME/bin/createdb -U pgspider $DB1
$PGS_HOME/bin/createdb -U pgspider $DB2
$PGS_HOME/bin/createdb -U pgspider $DB3

# init data
$PGS_HOME/bin/psql $DB1 -U pgspider < ./init.sql
$PGS_HOME/bin/psql $DB2 -U pgspider < ./init.sql
$PGS_HOME/bin/psql $DB3 -U pgspider < ./init.sql
