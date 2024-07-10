import { Router } from "express";
import { Object } from "../models/objects.js";
import { io } from "../app.js";

export const objectRouter = Router();

objectRouter.get("/", async (req, res, next) => {
  try {
    // input parameters: roomid
    const { roomId } = req.query;
    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    // get all objects for the room
    const objects = await Object.findAll({
      where: { RoomId: roomId },
    });

    const count = objects.length;

    return res.status(200).json({ objects: objects, count: count });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

objectRouter.post("/", async (req, res, next) => {
  try {
    const { text, x, y, size, parent, roomId } = req.body;
    if (
      x === undefined ||
      x === null ||
      y === undefined ||
      y === null ||
      size === undefined ||
      size === null ||
      !roomId
    ) {
      return res.status(400).json({
        error: "x, y, size, and roomId are required for creating an object",
      });
    }

    const object = await Object.create({
      text: text,
      x: x,
      y: y,
      size: size,
      parent: parent,
      RoomId: roomId,
    });
    io.emit(`object-${roomId}-create`, object);
    return res.status(201).json(object);
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

objectRouter.patch("/", async (req, res, next) => {
  try {
    const { objectId } = req.query;
    // don't allow to change the room
    const { text, x, y, size, parent } = req.body;

    const object = await Object.findByPk(objectId);
    if (!object) {
      return res.status(404).json({ error: "Object not found" });
    }

    if (text !== null && text !== undefined) object.text = text;
    if (x) object.x = x;
    if (y) object.y = y;
    if (size) object.size = size;
    if (parent) object.parent = parent;

    await object.save();
    io.emit(`object-${object.RoomId}-update`, object);
    return res.status(200).json({ id: object.id });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

objectRouter.delete("/:objectId", async (req, res, next) => {
  try {
    const { objectId } = req.params;

    const object = await Object.findByPk(objectId);
    if (!object) {
      return res.status(404).json({ error: "Object not found" });
    }

    await Object.update(
      { parent: object.parent },
      { where: { parent: objectId } }
    );

    await object.destroy();
    io.emit(`object-${object.RoomId}-delete`, object);
    return res.status(200).json({ object: object });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});
