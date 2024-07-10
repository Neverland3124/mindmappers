import { Router } from "express";
import { google } from "googleapis";
import { Token } from "../models/tokens.js";
import { User } from "../models/users.js";
import dotenv from "dotenv";

dotenv.config();
const client_id = process.env.GOOGLE_CLIENT_ID;
const client_secret = process.env.GOOGLE_CLIENT_SECRET;
const redirect_url = process.env.REDIRECT_URL || "http://localhost:3000/api/oauth2/googlecallback";

export const oauthRouter = Router();

// Create an OAuth2 client object with the client ID, client secret, and redirect URL
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_url
);

// Scopes define the level of access that the application is requesting from the user
// link to the scope we can choose from: https://developers.google.com/identity/protocols/oauth2/scopes
const scopes = [
  "https://www.googleapis.com/auth/userinfo.email",
  // "https://www.googleapis.com/auth/userinfo.profile"
];

const url = oauth2Client.generateAuthUrl({
  access_type: "offline", // use offline to get refresh token
  scope: scopes,
  prompt: "consent"
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
    console.log("tokens", tokens);
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
    const return_link = process.env.ORIGIN || "http://localhost:3000";
    // regular response with json
    res.redirect(return_link + "/?access_token=" + access_token);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// FIXME: remove later
// tokens get from oauth2Client.getToken(code) {
//   access_token: 'xxx',
//   refresh_token: 'xxx', // only get at the first time
//   scope: 'https://www.googleapis.com/auth/userinfo.email openid',
//   token_type: 'Bearer',
//   id_token: 'xxx',
//   expiry_date: 1719095126917
// }
// data get from oauth2.data.get() {
//   id: '123',
//   email: 'xyz@gmail.com',
//   verified_email: true,
//   picture: 'https://xyz'
// }

/*************** Helper Functions ***************/
async function createNewUserToken(data, tokens) {
  console.log("Creating new user token", data, tokens);
  // Create the new user and add the token to the database
  const newUser = await User.create({
    email: data.email,
    picture: data.picture,
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
  console.log("Creating new token", data, tokens);
  // Update the picture of the user
  const oldUser = await User.findOne({ where: { email: data.email } });
  await oldUser.update({ picture: data.picture });

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
    const access_token = tokenHeader.split(" ")[1]; // Assuming 'Bearer <token>'

    if (!access_token) {
      // If the token is not found, still return ok response since signout is successful
      return res.status(409).json({ message: "token not found" });
    }

    // remove token from oauth2Client
    oauth2Client.revokeToken(access_token);

    // remove token from database
    const token = await Token.findOne({
      where: { access_token: access_token },
    });
    await token.destroy();
    return res.status(200).json({ message: "signout successful" });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

oauthRouter.get("/me", async (req, res) => {
  try {
    const tokenHeader = req.headers.authorization;
    if (!tokenHeader) {
      return res
        .status(401)
        .json({ error: "Authorization token is required." });
    }
    const access_token = tokenHeader.split(" ")[1]; // Assuming 'Bearer <token>'

    if (!access_token) {
      return res.status(401).json({ error: "Token not provided." });
    }

    const tokenRecord = await Token.findOne({
      where: { access_token: access_token },
    });
    if (!tokenRecord) {
      return res.status(401).json({ error: "Token not found from database." });
    }
    let returnToken = tokenRecord.access_token;

    const data = await User.findOne({ where: { id: tokenRecord.UserId } });
    if (!data) {
      return res.status(404).json({ error: "User not found." });
    }

    if (tokenRecord.expiry_date < Date.now()) {
      // if expire is greater than now, it's not expired yet

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
      access_token: returnToken,
      email: data.email,
      picture: data.picture,
    });
  } catch (error) {
    return res.status(400).send({ error: "Error" });
  }
});
