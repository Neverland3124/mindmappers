import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { sequelize } from "./datasource.js";
import { oauthRouter } from "./routers/oauth_router.js";
import { webhookRouter } from "./routers/webhook_router.js";
// import { Server } from "socket.io";
// import { registerIOListeners } from "./socket.js";
import startGrpcServer from "./grpc-user-server.js";

import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
export const app = express();
// required to get socket server running with express
const httpServer = http.createServer(app);

app.use(bodyParser.json());

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } }); // This method is used to synchronize all defined models with the database
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.use(function (req, res, next) {
  console.log("HTTP request", req.method, req.url, req.hostname);
  next();
});

// initialize a socket server
// this adds the GET /socket.io endpoint
// export const io = new Server(httpServer, {
// });
// registerIOListeners(io);

app.use("/api/oauth2", oauthRouter);
app.use("/api/webhooks", webhookRouter);

startGrpcServer();

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
