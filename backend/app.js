import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { oauthRouter } from "./routers/oauth_router.js";
import { sequelize } from "./datasource.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
export const app = express();
app.use(bodyParser.json());

// Allow CORS
const corsOptions = {
  origin: process.env.ORIGIN,
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

// TODO need to add a middleware to check if the user is authenticated
app.use("/api/oauth2", oauthRouter);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
