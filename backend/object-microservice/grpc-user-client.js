import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

let client;

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

const userInfoProto = grpc.loadPackageDefinition(packageDefinition).mindmappers;

// Function to initialize the gRPC client connection
function initGrpcClient() {
  client = new userInfoProto.UserInfoService(
    "auth-microservice:50051",
    grpc.credentials.createInsecure()
  );
  console.log("gRPC client user initialized");
}

// Function to call getUserInfo
function getUserInfo(userID, callback) {
  if (!client) {
    console.error("gRPC client not initialized");
    return callback(new Error("Client not initialized"), null);
  }

  const request = { UserID: userID };
  client.getUserInfo(request, (error, response) => {
    if (error) {
      console.error("Error:", error);
      callback(error, null);
    } else {
      console.log("User Info:", response);
      callback(null, response);
    }
  });
}

export { initGrpcClient, getUserInfo };
