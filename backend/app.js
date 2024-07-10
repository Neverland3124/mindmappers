import http from "http";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sequelize } from "./datasource.js";
import { oauthRouter } from "./routers/oauth_router.js";
import { roomRouter } from "./routers/room_router.js";
import { objectRouter } from "./routers/object_router.js";
import { webhookRouter } from "./routers/webhook_router.js";
import { Server } from "socket.io";
import { registerIOListeners } from "./socket.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
export const app = express();
// required to get socket server running with express
const httpServer = http.createServer(app);

app.use(bodyParser.json());

// Allow CORS
const corsOptions = {
  origin: process.env.ORIGIN || "http://localhost:4200",
  credentials: true,
};
app.use(cors(corsOptions));

// Connect to the sqlite database
try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

app.use(function (req, res, next) {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

// initialize a socket server
// this adds the GET /socket.io endpoint
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"]
  }
});
registerIOListeners(io);

// TODO: need to add a middleware to check if the user is authenticated
app.use("/api/oauth2", oauthRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/objects", objectRouter);
app.use("/api/webhooks", webhookRouter)

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
