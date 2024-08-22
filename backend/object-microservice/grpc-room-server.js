import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import { Room } from "./models/rooms.js";
import { Object } from "./models/objects.js";
import path from "path";
import { fileURLToPath } from "url";

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

function startGrpcServer() {
  const server = new grpc.Server();
  server.addService(roomInfoProto.RoomInfoService.service, { getRoomInfo });
  server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
      console.log("gRPC server running at http://localhost:50051");
      // server.start();
    }
  );
}

// Implementing the getRoomInfo RPC
const getRoomInfo = async (call, callback) => {
  const roomID = call.request.roomID;
  if (!roomID) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: "Room ID is required",
    });
    return;
  } else {
    console.log("gRPC Received request for room ID:", roomID);
    const room = await Room.findOne({ where: { id: roomID } });
    const nodes = await Object.findAll({ where: { RoomId: roomID } });
    // console.log("nodes: ", nodes);
    if (!room || !nodes) {
      callback({
        code: grpc.status.NOT_FOUND,
        details: "Room not found",
      });
      return;
    } else {
      const roomInfo = {
        roomID: room.id,
        roomName: room.name,
        roomDescription: room.description,
        roomNodes: nodes.map((node) => node.text).join(", "),
      };
      console.log("Room Info:", roomInfo);
      callback(null, roomInfo);
    }
  }
};

// export { startGrpcServer, getRoomInfo };

export default startGrpcServer;
