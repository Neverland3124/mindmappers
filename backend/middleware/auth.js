import { Token } from "../models/tokens.js";
import { User } from "../models/users.js";

export const isAuthenticated = async function (req, res, next) {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) {
    return res.status(401).json({ error: "Authorization token is required." });
  }
  const token = tokenHeader.split(" ")[1];

  // Check if the token is not provided
  if (!token) {
    return res.status(401).json({ error: "Token not provided" });
  }

  try {
    // verify, don't refresh token, leave the refresh endpoint to handle that
    const userId = await verifyToken(token);
    if (!userId) {
      return res.status(401).json({ error: "Token is invalid or expired." });
    }

    const user = await User.findOne({ where: { id: userId } });
    req.userId = user.id;
    req.userEmail = user.email;
    req.name = user.name;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Failed to retrieve user information." });
  }
};

async function verifyToken(token) {
  const tokenRecord = await Token.findOne({
    where: { access_token: token },
  });

  if (!tokenRecord) {
    return null;
  }

  if (tokenRecord.expiry_date < Date.now()) {
    // Token is expired
    return null;
  }

  return tokenRecord.UserId;
}
