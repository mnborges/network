# network

[Project 4](https://cs50.harvard.edu/web/2020/projects/4/) of the cs50w course

## Set Up

Install docker, then compose docker containers by running the following command in the root directory:

`docker-compose up`

Migrate postgres db. Since this should be done inside container, fist run:

`bash docker ps`

Copy container ID then run:

`docker exec -it [CONTAINER_ID] bash -l`

Finally, inside the container, execute both commands:

`python manage.py makemigrations`
and
`python manage.py migrate`

## Project Video

https://youtu.be/BTLt-iNvnwg
