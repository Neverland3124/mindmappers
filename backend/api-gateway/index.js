import http from "http";
import express from "express";
// import bodyParser from "body-parser";
import cors from "cors";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { checkTokenInRedis } from "./middleware/auth.js";
import { initGrpcClient } from "./grpc-user-client.js";
import dotenv from "dotenv";
initGrpcClient();
dotenv.config();

const PORT = 3000;
export const app = express();
const httpServer = http.createServer(app);
const microservice_auth_origin =
  process.env.MICROSERVICE_AUTH_ORIGIN || "http://auth-microservice-dev:3000";
const microservice_object_origin =
  process.env.MICROSERVICE_OBJECT_ORIGIN ||
  "http://object-microservice-dev:3000";
const microservice_image_origin =
  process.env.MICROSERVICE_IMAGE_ORIGIN || "http://image-microservice-dev:3000";

// console.log("origin: ", process.env.ORIGIN);
// console.log("microservice_auth_origin: ", microservice_auth_origin);
// console.log("microservice_object_origin: ", microservice_object_origin);

const corsOptions = {
  // now only the api gateway need to set cors
  origin: process.env.ORIGIN || "https://mindmappers.neverland3124.me",
  // origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(function (req, res, next) {
  console.log("HTTP request api gateway", req.method, req.url);
  next();
});

// app.use(bodyParser.json());
const onProxyReq = (proxyReq, req, res) => {
  // we don't need fixRequestBody since we don't call body parser
  // fixRequestBody(proxyReq, req, res);
  if (req.userId) {
    proxyReq.setHeader("X-User-Id", req.userId);
  }
  if (req.userEmail) {
    proxyReq.setHeader("X-User-Email", req.userEmail);
  }
  if (req.name) {
    proxyReq.setHeader("X-User-Name", req.name);
  }
};

// Proxy configuration
// TODO: use environment variables
function createCustomProxy(target, additionalOptions = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: false,
    logger: console,
    ...additionalOptions,
  });
}

const oauth2Proxy = createCustomProxy(microservice_auth_origin + "/api/oauth2");

const webhooksProxy = createCustomProxy(
  microservice_auth_origin + "/api/webhooks"
);

const roomsProxy = createCustomProxy(
  microservice_object_origin + "/api/rooms",
  {
    on: { proxyReq: onProxyReq },
  }
);

const objectsProxy = createCustomProxy(
  microservice_object_origin + "/api/objects",
  {
    on: { proxyReq: onProxyReq },
  }
);

const imagesProxy = createCustomProxy(
  microservice_image_origin + "/api/images",
  {
    on: { proxyReq: onProxyReq },
  }
);

// Use the proxy middleware
app.use("/api/oauth2", oauth2Proxy);
app.use("/api/webhooks", checkTokenInRedis, webhooksProxy);
app.use("/api/objects", checkTokenInRedis, objectsProxy);
app.use("/api/rooms", checkTokenInRedis, roomsProxy);
app.use("/api/images", checkTokenInRedis, imagesProxy);

// now set to use one websocket
const proxy = createProxyMiddleware({
  pathFilter: "/ws/object",
  target: microservice_object_origin,
  changeOrigin: true,
  ws: false,
  logger: console,
});
app.use(proxy);

httpServer.on("upgrade", function (req, socket, head) {
  console.log("WebSocket upgrade request url:", req.url);
  proxy.upgrade(req, socket, head);
});

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://api-gateway:%s", PORT);
});
