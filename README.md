# Mindmappers

## What is Mindmappers
- A collaborative mind-mapping tool designed to facilitate real-time brainstorming and idea organization for individuals and teams.
- Monolith version: https://www.mindmappers.felixlyy.me/
- Microservice version: https://mindmappers.neverland3124.me/

## Why Mindmappers-microservice?
- Try the possibility of microservice and deploy with Kubernetes
- Also fix some of the issues for the monolith version
- Open source the project for everyone to learn different technologies

### Original Monolith Version
- Check branch Mindmappers-monolith
- `Project Proposal.md` contains the original monolith project detail

## Architecture
- Backend - use microservice with api-gateway
  - Each request go to api-gateway and based on the url route to different services
    - Api-Gateway
      - handing cors, routing, websocket upgrade, redis cache of token
    - Auth Microservices
      - authentication of google oauth2 and send email and webhook feature
    - Object Microservices
      - create room, create object, core website features
    - Image Microservices
      - able to send generate image task and get image
    - Image Worker Microservices
      - worker to get task and generate image
- Frontend
  
## Technologies
- NodeJS + ExpressJS for backend run time and server
- PostgreSQL + sequelize for store data
- Google Oauth2 for user login
- Redis + ioredis library for cache token
- Ant Design as UI library
- socket.io for websocket
- OpenAI for ai image generation
- AWS S3 for image storage and get
- Mailersend for send email and trigger webhook
- Docker + GHCR for CICD and monolith deploy
- Kubernetes + GKE for microservices deploy
- AngularJS for frontend framework
- GoJS for diagram and map

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.