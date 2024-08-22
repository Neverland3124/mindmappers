import { Router } from "express";
import { Room } from "../models/rooms.js";
import { io } from "../app.js";
import { initGrpcClient, getUserInfo } from "../grpc-user-client.js";

// Initialize the gRPC client
initGrpcClient();

export const roomRouter = Router();

roomRouter.get("/", async (req, res, next) => {
  console.log("Getting all rooms:", parseInt(req.headers['x-user-id']));
  try {
    const rooms = await Room.findAll({
      order: [["createdAt", "DESC"]],
    });

    const transformedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      owner: room.UserId,
      ownerName: room.ownerName,
      ownerAvatar: room.ownerAvatar,
    }));

    const roomsCount = rooms.length;
    return res.status(200).json({ rooms: transformedRooms, count: roomsCount });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.post("/", async (req, res, next) => {
  console.log("Creating room:", parseInt(req.headers['x-user-id']));
  console.log("req.body:", req.body); 
  // console.log("req:", req)
  const userId = parseInt(req.headers['x-user-id']);
  try {
    // Input parameters
    const { name, description } = req.body;
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "name and description are required for creating room" });
    }

    // Check if room with the same name already exists
    const roomExists = await Room.findOne({ where: { name: name } });
    if (roomExists) {
      return res.status(400).json({ error: "Room name already exists" });
    }

    try {
      const response = await new Promise((resolve, reject) => {
        getUserInfo(userId, (error, response) => {
          if (error) {
            reject(error);
          } else {
            resolve(response);
          }
        });
      });

      const { UserID: userID, UserName: userName, UserAvatar: userAvatar } = response;
      console.log("User Info:", userID, userName, userAvatar);

      const room = await Room.create({
        name: name,
        description: description,
        UserId: userID,
        ownerName: userName,
        ownerAvatar: userAvatar,
      });

      io.emit("room-created", {
        id: room.id,
        name: room.name,
        description: room.description,
        owner: room.UserId,
        ownerName: userName,
        ownerAvatar: userAvatar,
      });

      return res
        .status(201)
        .json({ id: room.id, name: room.name, description: room.description });
    } catch (error) {
      console.error("Failed to get room info:", error);
      return res.status(500).send({ error: error });
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.patch("/:roomId", async (req, res, next) => {
  const userId = parseInt(req.headers['x-user-id']);
  try {
    const roomId = req.params.roomId;
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    //  verify if the user is the owner of the room
    if (room.UserId !== userId) {
      return res.status(403).json({ error: "Unauthorized to update the room" });
    }

    // Input parameters
    const { name, description } = req.body;
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "name and description are required for updating room" });
    }

    // Check if room with the same name already exists
    const roomExists = await Room.findOne({ where: { name: name } });
    if (roomExists && roomExists.id !== room.id) {
      // some other room already has the same name
      return res.status(400).json({ error: "Room name already exists" });
    }

    room.name = name;
    room.description = description;
    await room.save();

    io.emit("room-updated", {
      id: room.id,
      name: room.name,
      description: room.description,
    });

    // Emit to user inside the room
    io.emit(`room-updated-${room.id}`, {
      id: room.id,
      name: room.name,
      description: room.description,
    });

    return res
      .status(200)
      .json({ id: room.id, name: room.name, description: room.description });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.delete("/:roomId", async (req, res, next) => {
  const userId = parseInt(req.headers['x-user-id']);
  try {
    const roomId = req.params.roomId;
    const room = await Room.findByPk(roomId);
    const emitId = room.id;

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    //  verify if the user is the owner of the room
    if (room.UserId !== userId) {
      return res.status(403).json({ error: "Unauthorized to delete the room" });
    }

    await room.destroy();
    io.emit("room-deleted", { id: emitId });
    return res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});
