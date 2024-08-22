import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { User } from "./models/users.js";
import { Token } from "./models/tokens.js";
import path from "path";
import { fileURLToPath } from "url";

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, "../protos/user.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).mindmappers;

function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(userProto.UserInfoService.service, {
    getUserInfo: getUserInfo,
    getUserToken: getUserToken,
  });
  server.bindAsync(
    "0.0.0.0:50051", // localhost restrict the access within the container itself
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log("gRPC server running at http://localhost:50051");
      // server.start();
    }
  );
}

// Implementing the getUserInfo RPC
const getUserInfo = async (call, callback) => {
  const userID = call.request.UserID;
  if (!userID) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "User ID is required",
    });
    return;
  } else {
    console.log("gRPC Received request for user ID:", userID);
    const user = await User.findOne({ where: { id: userID } });
    if (!user) {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "User not found",
      });
      return;
    } else {
      const userInfo = {
        UserID: user.id,
        UserName: user.name,
        UserAvatar: user.avatar,
      };
      console.log("User Info:", userInfo);
      callback(null, userInfo);
    }
  }
};

// so we will be given a oldToken, if it's still valid, we will return it, if it's expired, we will return a failed response to let client refresh token by request
const getUserToken = async (call, callback) => {
  const oldToken = call.request.oldToken;
  if (!oldToken) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Old token is required",
    });
    return;
  }
  console.log("gRPC Received request for old token:", oldToken);
  const token = await Token.findOne({ where: { access_token: oldToken } });
  if (!token) {
    callback({
      code: grpc.status.NOT_FOUND,
      details: "Token not found",
    });
    return;
  }

  if (token.expiry_date < Date.now()) {
    // token has expired, return failed response
    callback({
      code: grpc.status.FAILED_PRECONDITION,
      details: "Token is expired",
    });
    return;
  }

  // case that token is still valid, only expired on redis
  const new_token = token.access_token;
  // get the user info of the token
  const user = await User.findOne({ where: { id: token.UserId } });
  const user_id = user.id;
  const user_name = user.name;
  const user_email = user.email;
  console.log("New token:", new_token, user_id, user_name, user_email);
  callback(null, {
    newToken: new_token,
    UserID: user_id,
    UserName: user_name,
    UserEmail: user_email,
  });
};

export default startGrpcServer;
