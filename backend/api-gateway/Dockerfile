# Dockerfile adapted from 
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:18-alpine

# ARG can be pass during build time by using --build-arg
# recommend to use ENV instead of ARG, therefore comment out below
# Declare arguments
# ARG ORIGIN
# ARG REDIS_HOST
# ARG REDIS_PORT

# Optionally set them as environment variables if you want them to be
# available in the running container
# ENV ORIGIN=$ORIGIN \
#     REDIS_HOST=$REDIS_HOST \
#     REDIS_PORT=$REDIS_PORT

# Create app directory
WORKDIR /usr/src/backend/api-gateway

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY api-gateway/package*.json ./

RUN npm install

# Bundle app source
COPY api-gateway/. .

# if run individually, need to use -f to set the path
COPY protos /usr/src/backend/protos

EXPOSE 3000
CMD ["npm", "start"]
# CMD [ "node", "app.js" ]