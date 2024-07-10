# Dockerfile adapted from 
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:16

# Declare arguments
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG REDIRECT_URL
ARG ORIGIN
ARG DATABASE_NAME
ARG DATABASE_USER
ARG DATABASE_PASSWORD
ARG DATABASE_HOST

# Optionally set them as environment variables if you want them to be
# available in the running container
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
    GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
    REDIRECT_URL=$REDIRECT_URL \
    ORIGIN=$ORIGIN \
    DATABASE_NAME=$DATABASE_NAME \
    DATABASE_USER=$DATABASE_USER \
    DATABASE_PASSWORD=$DATABASE_PASSWORD \
    DATABASE_HOST=$DATABASE_HOST

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "app.js" ]