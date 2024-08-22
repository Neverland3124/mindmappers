# Dockerfile adapted from 
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
FROM node:18-alpine

# Declare arguments
# ARG GOOGLE_CLIENT_ID
# ARG GOOGLE_CLIENT_SECRET
# ARG REDIRECT_URL
# ARG ORIGIN
# ARG DATABASE_NAME
# ARG DATABASE_USER
# ARG DATABASE_PASSWORD
# ARG DATABASE_HOST
# ARG MAILERSEND_API_KEY
# ARG OPENAI_API_KEY
# ARG AWS_ACCESS_KEY_ID
# ARG AWS_SECRET_ACCESS_KEY
# ARG AWS_REGION
# ARG AWS_BUCKET_NAME
# ARG REDIS_HOST
# ARG REDIS_PORT

# Optionally set them as environment variables if you want them to be
# available in the running container
# ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
#     GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
#     REDIRECT_URL=$REDIRECT_URL \
#     ORIGIN=$ORIGIN \
#     DATABASE_NAME_IMAGE=$DATABASE_NAME_IMAGE \
#     DATABASE_USER=$DATABASE_USER \
#     DATABASE_PASSWORD=$DATABASE_PASSWORD \
#     DATABASE_HOST_IMAGE=$DATABASE_HOST_IMAGE \
#     MAILERSEND_API_KEY=$MAILERSEND_API_KEY \
#     OPENAI_API_KEY=$OPENAI_API_KEY \
#     AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
#     AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
#     AWS_REGION=$AWS_REGION \
#     AWS_BUCKET_NAME=$AWS_BUCKET_NAME \
#     REDIS_HOST=$REDIS_HOST \
#     REDIS_PORT=$REDIS_PORT

# Create app directory
WORKDIR /usr/src/backend/image-worker-microservice

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY image-worker-microservice/package*.json ./

RUN npm install

# Bundle app source
COPY image-worker-microservice/. .

COPY protos /usr/src/backend/protos

CMD ["npm", "start"]
# CMD [ "node", "app.js" ]