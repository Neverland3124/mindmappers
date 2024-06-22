import { Router } from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

export const oauthRouter = Router();

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_url = process.env.REDIRECT_URL;
const token = null; // save on local storage

// Create an OAuth2 client object with the client ID, client secret, and redirect URL
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_url,
);

// Scopes define the level of access that the application is requesting from the user
const scopes = ["https://www.googleapis.com/auth/userinfo.email"];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
});

oauthRouter.get("/", (req, res) => {
  // Login logic here
  res.send("<a href='/oauth/signin'>sign in</a>");
});

oauthRouter.get("/signin", (req, res) => {
  // Signin logic here
  res.send(`<a href='${url}'>sign in with google</a>`);
});

oauthRouter.get("/googlecallback", async (req, res) => {
  const code = req.query.code;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  res.send(data);
});

oauthRouter.get("/signout", (req, res) => {
  // Signout logic here
  oauth2Client.revokeToken(token);

  res.send("sign out");
});

oauthRouter.get("/refresh", async (req, res) => {
  try {
    // Refresh token logic here
    await oauth2Client.refreshAccessToken();
    res.send("refresh token");
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: "Error" });
  }
});

oauthRouter.get("/me", async (req, res) => {
  try {
    // Get user info logic here
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    res.send(data);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ error: "Error" });
  }
});
