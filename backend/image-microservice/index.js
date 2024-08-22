import http from "http";
import express from "express";
import bodyParser from "body-parser";
import { sequelize } from "./datasource.js";
import { imageRouter } from "./routers/image_router.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = 3000;
export const app = express();
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
  console.log("HTTP request to Image Service", req.method, req.url);
  next();
});

app.use("/api/images", imageRouter);

httpServer.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
