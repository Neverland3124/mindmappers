import { Router } from "express";
import { Room } from "../models/rooms.js";
import { io } from "../app.js";

export const roomRouter = Router();

roomRouter.get("/", async (req, res, next) => {
  try {
    const rooms = await Room.findAll({
      order: [["updatedAt", "DESC"]], // Order by 'updatedAt' in descending order
    });
    const roomsCount = rooms.length;
    return res.status(200).json({ rooms: rooms, count: roomsCount });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.post("/", async (req, res, next) => {
  try {
    // Input parameters
    const { name, description } = req.body;
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "name and description are required for creating room" });
    }

    const room = await Room.create({
      name: name,
      description: description,
      owner: 1, // TODO: get the userid from the token
    });

    io.emit("room-created", {
      id: room.id,
      name: room.name,
      description: room.description,
    });

    return res
      .status(201)
      .json({ id: room.id, name: room.name, description: room.description });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

roomRouter.delete("/:roomId", async (req, res, next) => {
  try {
    const roomId = req.params.roomId;
    const room = await Room.findByPk(roomId);
    const emitId = room.id;

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    // TODO: get the userid from the token?
    //  verify if the user is the owner of the room

    await room.destroy();
    io.emit("room-deleted", { id: emitId });

    return res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});


