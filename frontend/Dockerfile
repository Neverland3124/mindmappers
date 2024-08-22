# Build the Angular App
# basically, this compiles the Angular project to static HTML and js files.
FROM node:18-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --silent
COPY . ./

# Use build argument to determine the build profile
# ARG PROFILE=production
# RUN if [ "$PROFILE" = "development" ]; then npm run build; else npm run build --prod; fi
RUN npm run build

# Serve these static files with NGINX.
FROM nginx:1.21.6-alpine
COPY --from=build /app/dist/mindmappers/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# daemon off; is used to keep the container running (keep nginx serve the static files). 
# Otherwise, it will exit immediately after starting.
