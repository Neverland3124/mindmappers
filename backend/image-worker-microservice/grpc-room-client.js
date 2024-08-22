import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "path";
import { fileURLToPath } from "url";

let client;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROTO_PATH = path.join(__dirname, "../protos/room.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const roomInfoProto = grpc.loadPackageDefinition(packageDefinition).mindmappers;

// Function to initialize the gRPC client connection
function initGrpcClient() {
  client = new roomInfoProto.RoomInfoService(
    "object-microservice:50051",
    grpc.credentials.createInsecure()
  );
  console.log("gRPC client room initialized");
}

// Function to call getRoomInfo
function getRoomInfo(roomID, callback) {
  if (!client) {
    console.error("gRPC client not initialized");
    return callback(new Error("Client not initialized"), null);
  }

  const request = { roomID };
  client.getRoomInfo(request, (error, response) => {
    if (error) {
      console.error("Error:", error);
      callback(error, null);
    } else {
      console.log("Room Info:", response);
      callback(null, response);
    }
  });
}

export { initGrpcClient, getRoomInfo };
