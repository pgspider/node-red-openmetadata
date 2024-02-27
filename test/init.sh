#! /bin/bash

HOME=$(pwd)

# init open-metadata test docker

## build PGSpider docker
cd docker/PGSpider
docker build -t pgspider_server .

cd $HOME
cd docker/PostgreSQL
docker build -t postgres_server .

## run open-metadata docker
cd $HOME
docker compose -f docker-compose-postgres.yml up --detach
docker exec -u pgspider pgspider_test  /bin/bash -c '/home/pgspider/init_pgspider.sh'
