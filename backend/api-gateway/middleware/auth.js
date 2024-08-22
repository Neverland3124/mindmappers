import Redis from "ioredis";
import { getUserToken } from "../grpc-user-client.js";
// goal is to store token in redis as cache so that we don't have to hit the auth server for every request
const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379,
  //   family: 4,
});

// Function to cache a token
async function cacheToken(newToken, userID, userName, userEmail, expiresIn) {
  const userInfo = {
    userID: userID,
    userName: userName,
    userEmail: userEmail,
  };
  console.log("cacheToken userInfo: ", newToken, userInfo);

  await redis.set(newToken, JSON.stringify(userInfo), "EX", expiresIn);
}

// Function to get cached token info
async function getCachedTokenInfo(token) {
  const cachedData = await redis.get(token);
  console.log("cachedData: ", cachedData);
  return cachedData ? JSON.parse(cachedData) : null;
}

// Middleware to check token in Redis
// what it does:
// if token not provide, just 401
// if token is provide, two cases: valid (might expired) or invalid
// if token is invalid, then it's not in our redis database, and our request
//   to refresh token will return 404 not found, we will return 404 to client
// if token is valid: two cases: in redis or not in redis
// if token is in redis, set req.userId, userEmail, req.name for the request
// if token is not in redis, we don't refresh token, just return 401 to client
const checkTokenInRedis = async (req, res, next) => {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) {
    return res.status(401).json({ error: "Authorization token is required." });
  }
  const token = tokenHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  try {
    const cachedUserInfo = await getCachedTokenInfo(token);
    if (cachedUserInfo) {
      console.log("found on redis:", cachedUserInfo);
      req.userId = cachedUserInfo.userID;
      req.userEmail = cachedUserInfo.userEmail;
      req.name = cachedUserInfo.userName;
      next();
    } else {
      console.log("not found on redis");
      try {
        const response = await new Promise((resolve, reject) => {
          getUserToken(token, (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          });
        });

        const { newToken, UserID, UserName, UserEmail } = response;
        await cacheToken(newToken, UserID, UserName, UserEmail, 1200);
        // time in seconds
        // Cache the token for 20 minutes - 1200
        req.userId = UserID;
        req.userEmail = UserEmail;
        req.name = UserName;
        console.log(
          "api gateway middleware newToken, userID, userName, userEmail: ",
          newToken,
          userID,
          userName,
          userEmail
        );
        next();
      } catch (error) {
        res
          .status(401)
          .json({ message: "Unauthorized: Invalid or expired token" });
      }
    }
  } catch (error) {
    return res.status(error.response ? error.response.status : 500).json({
      error: error.response
        ? error.response.data.error
        : "Failed to verify token.",
    });
  }
};

export { checkTokenInRedis };
