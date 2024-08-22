import http from "http";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sequelize } from "./datasource.js";
import { roomRouter } from "./routers/room_router.js";
import { objectRouter } from "./routers/object_router.js";
import { Server } from "socket.io";
import { registerIOListeners } from "./socket.js";
import startGrpcServer from "./grpc-room-server.js";


import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
export const app = express();
// required to get socket server running with express
const httpServer = http.createServer(app);

app.use(bodyParser.json());

// Connect to the sqlite database
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
export const io = new Server(httpServer, {
  path: "/ws/object/socket.io",
});
registerIOListeners(io);

app.use("/api/rooms", roomRouter);
app.use("/api/objects", objectRouter);

startGrpcServer();

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
