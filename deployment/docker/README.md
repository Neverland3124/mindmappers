# Docker Deployment

## Issues
- the .env is still getting from each service's .env, could change to use a env file only on the same direction of the docker-compose.yml file
- --profile production version is not working due to deploy by kubernetes at last
- --profile development version should be working after add env file and change the setting for gRPC
- for learner: can check kubernetes readme to see which secret and config map to generate a .env file

## Commands
```shell
docker compose --profile development up --build
```