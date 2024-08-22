import { Router } from "express";
import { Object } from "../models/objects.js";
import { io } from "../app.js";

export const objectRouter = Router();

// get all objects for a room
objectRouter.get("/", async (req, res, next) => {
  try {
    const { roomId } = req.query;
    if (!roomId) {
      return res.status(400).json({ error: "roomId is required" });
    }

    // get all objects for the room
    const objects = await Object.findAll({
      where: { RoomId: roomId },
    });

    const count = objects.length;

    return res.status(200).json({ count: count, objects });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

objectRouter.post("/", async (req, res, next) => {
  const { nodes, roomId } = req.body;
  const transaction = await Object.sequelize.transaction();

  try {
    let values = "";
    let params = [];

    nodes.forEach((node, index) => {
      const { key, text, loc, dir, parent, font } = node;

      if (index > 0) values += ", ";
      values += `(?, ?, ?, ?, ?, ?, ?, ${"CURRENT_TIMESTAMP"},${"CURRENT_TIMESTAMP"})`;
      params.push(key, roomId, text, loc, dir, parent, font);
    });

    const sql = `
      INSERT INTO "Objects" ("key", "RoomId", "text", "loc", "dir", "parent", "font", "createdAt", "updatedAt")
      VALUES ${values};
    `;

    await Object.sequelize.query(sql, {
      replacements: params,
      transaction,
    });

    await transaction.commit();

    io.emit(`object-${roomId}-create`, { nodes, userId: parseInt(req.headers['x-user-id']) });
    return res.status(201).json({ nodes });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).send({ error: `Error when create nodes: ${error}` });
  }
});

objectRouter.patch("/", async (req, res, next) => {
  const { nodes, roomId } = req.body;
  const transaction = await Object.sequelize.transaction();

  try {
    let values = "";
    let params = [];

    nodes.forEach((node, index) => {
      const { key, text, loc, dir, parent, font } = node;

      if (index > 0) values += ", ";
      values += `(${key}, ?, ?, ?, ?, ?, ?)`;
      params.push(roomId, text, loc, dir, parent, font);
    });

    const sql = `
      UPDATE "Objects"
      SET
        text = vals.text,
        loc = vals.loc,
        dir = vals.dir,
        parent = vals.parent,
        "font" = vals."font"
      FROM (VALUES
        ${values}
      ) AS vals("key", "RoomId", "text", "loc", "dir", "parent", "font")
      WHERE "Objects"."key" = vals."key" AND "Objects"."RoomId" = vals."RoomId";
    `;

    await Object.sequelize.query(sql, {
      replacements: params,
      transaction,
    });

    await transaction.commit();

    io.emit(`object-${roomId}-update`, { nodes, userId: parseInt(req.headers['x-user-id']) });
    return res
      .status(200)
      .json({ updatedObjectIds: nodes.map((node) => node.key) });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).send({ error: `Error when update nodes: ${error}` });
  }
});

objectRouter.delete("/", async (req, res) => {
  const { roomId, objectIds } = req.body;

  const transaction = await Object.sequelize.transaction();

  try {
    let values = objectIds.map((id) => `(${id}, ${roomId})`).join(", ");

    const sql = `
      WITH vals AS (
          VALUES ${values}
      )
      DELETE FROM "Objects"
      USING vals
      WHERE "Objects"."key" = vals.column1 AND "Objects"."RoomId" = vals.column2;
    `;

    await Object.sequelize.query(sql, {
      transaction,
    });

    await transaction.commit();

    io.emit(`object-${roomId}-delete`, {
      keys: objectIds,
      userId: parseInt(req.headers['x-user-id']),
    });

    return res
      .status(200)
      .json({ updatedObjectIds: objectIds.map((node) => node.key) });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).send({ error: `Error when delete nodes: ${error}` });
  }
});
