import { Router } from "express";
import { google } from "googleapis";
import { Token } from "../models/tokens.js";
import { User } from "../models/users.js";

import dotenv from "dotenv";
dotenv.config();

const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_url =
  process.env.REDIRECT_URL || "http://localhost:3000/api/oauth2/googlecallback";

export const oauthRouter = Router();

// Create an OAuth2 client object with the client ID, client secret, and redirect URL
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_url,
);

// Scopes define the level of access that the application is requesting from the user
// link to the scope we can choose from: https://developers.google.com/identity/protocols/oauth2/scopes
const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline", // use offline to get refresh token
  scope: scopes,
  prompt: "consent",
});

oauthRouter.post("/signin", (req, res) => {
  // Signin logic here
  res.json({ url });
  // send a fetch to googlecallback
});

oauthRouter.get("/googlecallback", async (req, res) => {
  try {
    if (!req.query.code) {
      return res.status(400).json({ error: "authorizationCode not found" });
    }
    const code = req.query.code;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    const user = await User.findOne({ where: { email: data.email } });
    if (user) {
      // If the user already exists, update user information
      await createNewToken(data, tokens);
    } else {
      await createNewUserToken(data, tokens);
    }

    const access_token = tokens.access_token;
    const return_link = process.env.ORIGIN || "http://localhost:4200";
    // regular response with json
    res.redirect(return_link + "/?access_token=" + access_token);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

/*************** Helper Functions ***************/
async function createNewUserToken(data, tokens) {
  // Create the new user and add the token to the database
  const newUser = await User.create({
    email: data.email,
    avatar: data.picture,
    name: data.name,
  });

  await Token.create({
    UserId: newUser.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    id_token: tokens.id_token,
    expiry_date: tokens.expiry_date,
  });
}

async function createNewToken(data, tokens) {
  // Update the avatar of the user
  const oldUser = await User.findOne({ where: { email: data.email } });
  await oldUser.update({
    avatar: data.picture,
    name: data.name,
  });

  // Add a new token to the database
  await Token.create({
    UserId: oldUser.id,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    scope: tokens.scope,
    token_type: tokens.token_type,
    id_token: tokens.id_token,
    expiry_date: tokens.expiry_date,
  });
}

oauthRouter.post("/signout", async (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      return res.status(409).json({ error: "Authorization token not found." });
    }
    const access_token = tokenHeader.split(" ")[1];

    if (!access_token) {
      // If the token is not found, still return ok response since signout is successful
      return res.status(409).json({ message: "token not found" });
    }

    if (access_token === "free-trial-fake-access-token") {
      return res.status(200).json({ message: "signout successful" });
    }

    // remove token from database
    const token = await Token.findOne({
      where: { access_token: access_token },
    });

    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    // remove token from oauth2Client if the token exists
    await oauth2Client.revokeToken(access_token);

    await token.destroy();
    return res.status(200).json({ message: "signout successful" });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

oauthRouter.post("/freetrial", async (req, res) => {
  try {
    const user = await User.findOne({
      where: { email: "freetrial.mindmapper@mail.com" },
    });
    if (user) {
      const token = await Token.findOne({ where: { UserId: user.id } });
      if (!token) {
        return res.status(404).json({ error: "Token not found" });
      }
      // return the access token
      return res.json({ access_token: token.access_token });
    } else {
      // cannot find the exist free trial user, create a new one
      const newUser = await User.create({
        email: "freetrial.mindmapper@mail.com",
        avatar: "/assets/logo-transparent.png",
        name: "Free Trial Account",
      });

      const newToken = await Token.create({
        UserId: newUser.id,
        access_token: "free-trial-fake-access-token",
        refresh_token: "free-trial-fake-refresh-token",
        scope: "free-trial-fake-scope",
        token_type: "free-trial-fake-token-type",
        id_token: "free-trial-fake-id-token",
        expiry_date: new Date("9999-12-31T23:59:59Z").getTime(),
      });

      return res.json({ access_token: newToken.access_token });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

oauthRouter.get("/me", async (req, res) => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      return res
        .status(404)
        .json({ error: "Authorization token is required." });
    }
    const access_token = tokenHeader.split(" ")[1];

    if (!access_token) {
      return res.status(404).json({ error: "Token not provided." });
    }

    const tokenRecord = await Token.findOne({
      where: { access_token: access_token },
    });

    if (!tokenRecord) {
      return res.status(401).json({ error: "Wrong Token." });
    }
    let returnToken = tokenRecord.access_token;

    const data = await User.findOne({ where: { id: tokenRecord.UserId } });
    if (!data) {
      return res.status(401).json({ error: "User not found." });
    }

    if (tokenRecord.expiry_date < Date.now()) {
      // already expired
      await oauth2Client.setCredentials({
        refresh_token: tokenRecord.refresh_token,
      });
      const refreshResponse = await oauth2Client.refreshAccessToken();
      const newCredentials = {
        refresh_token: tokenRecord.refresh_token,
        access_token: refreshResponse.credentials.access_token,
        scope: refreshResponse.credentials.scope,
        token_type: refreshResponse.credentials.token_type,
        id_token: refreshResponse.credentials.id_token,
        expiry_date: refreshResponse.credentials.expiry_date,
      };

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      returnToken = refreshResponse.credentials.access_token;
      await createNewToken(data, newCredentials);
      await tokenRecord.destroy();
    }

    return res.status(200).json({
      id: data.id,
      access_token: returnToken,
      email: data.email,
      avatar: data.avatar,
      name: data.name,
    });
  } catch (error) {
    return res.status(500).send({ error: `Error when get me: ${error}` });
  }
});

oauthRouter.post("/refresh", async (req, res) => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      return res.status(404).json({ error: "Authorization token is missing." });
    }
    const access_token = tokenHeader.split(" ")[1];

    if (!access_token) {
      return res.status(404).json({ error: "Token not provided." });
    }

    const tokenRecord = await Token.findOne({
      where: { access_token: access_token },
    });

    if (!tokenRecord) {
      return res.status(404).json({ error: "Token not found." });
    }

    if (tokenRecord.expiry_date < Date.now()) {
      // already expired
      await oauth2Client.setCredentials({
        refresh_token: tokenRecord.refresh_token,
      });
      const refreshResponse = await oauth2Client.refreshAccessToken();

      await tokenRecord.update({
        access_token: refreshResponse.credentials.access_token,
        expiry_date: refreshResponse.credentials.expiry_date,
        id_token: refreshResponse.credentials.id_token,
      });
      await tokenRecord.save();

      // return the new access token
      const accessToken = tokenRecord.access_token;
      return res.status(200).json({ access_token: accessToken });
    }
    // return the old access token
    return res.status(200).json({ access_token: access_token });
  } catch (error) {
    return res
      .status(500)
      .send({ error: `Error when refresh token: ${error}` });
  }
});
