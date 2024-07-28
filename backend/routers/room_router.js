import { Router } from "express";
import { Room } from "../models/rooms.js";
import { User } from "../models/users.js";
import { io } from "../app.js";
import { isAuthenticated } from "../middleware/auth.js";

export const roomRouter = Router();

roomRouter.get("/", isAuthenticated, async (req, res, next) => {
  try {
    const rooms = await Room.findAll({
      order: [["createdAt", "DESC"]],
      include: {
        model: User,
        attributes: ["id", "name", "avatar"],
      },
    });

    // id, name, description, owner, ownerAvatar
    // where owner is UserId and ownerAvatar is User.picture
    const transformedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      owner: room.UserId,
      ownerName: room.User.name,
      ownerAvatar: room.User.avatar,
    }));

    const roomsCount = rooms.length;
    return res.status(200).json({ rooms: transformedRooms, count: roomsCount });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.post("/", isAuthenticated, async (req, res, next) => {
  const userId = req.userId;
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

    const room = await Room.create({
      name: name,
      description: description,
      UserId: userId,
    });

    const user = await User.findByPk(userId);

    io.emit("room-created", {
      id: room.id,
      name: room.name,
      description: room.description,
      owner: room.UserId,
      ownerName: user.name,
      ownerAvatar: user.avatar,
    });

    return res
      .status(201)
      .json({ id: room.id, name: room.name, description: room.description });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.patch("/:roomId", isAuthenticated, async (req, res, next) => {
  const userId = req.userId;
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

roomRouter.delete("/:roomId", isAuthenticated, async (req, res, next) => {
  const userId = req.userId;
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
