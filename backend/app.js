import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { oauthRouter } from "./routers/oauth_router.js";

const PORT = 3000;
export const app = express();
app.use(bodyParser.json());

const corsOptions = {
  origin: "http://localhost:4200",
  credentials: true,
};
app.use(cors(corsOptions));

app.use("/oauth", oauthRouter);

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});
