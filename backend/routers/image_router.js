import { Router } from "express";
import { Room } from "../models/rooms.js";
import { isAuthenticated } from "../middleware/auth.js";
import { Queue } from "bullmq";
import { Image } from "../models/images.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Mutex } from "async-mutex";
import { io } from "../app.js";

import dotenv from "dotenv";
dotenv.config();

// lock for image generation
const mutex = new Mutex();

export const imageRouter = Router();

const s3 = new S3Client({
  region: process.env["AWS_REGION"],
});

const imagesQueue = new Queue("Images", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

imageRouter.post("/", isAuthenticated, async (req, res) => {
  // Request to generate image from text
  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: "Text and RoomId is required" });
  }
  try {
    // get the room name and description from the room id
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const { name, description } = {
      name: room.name,
      description: room.description,
    };

    // set generating image status to 1
    if (room.generatingImage === 1) {
      return res.status(409).json({
        error:
          "An image is currently being generated for this room. Please wait.",
      });
    }

    // case room.generatingImage === 0 or 2, no image or have previous image
    // need regenerate
    room.generatingImage = 1;
    await room.save();

    imagesQueue.add("ImageCreate", {
      roomId: roomId,
      roomName: name,
      roomDescription: description,
    });

    return res.status(202).json({
      message: `Request received, generate a image for room: ${name}.`,
    });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

imageRouter.get("/", isAuthenticated, async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) {
    return res.status(400).json({ error: "RoomId is required" });
  }

  const release = await mutex.acquire();
  try {
    // get the generating image status from the room id
    const room = await Room.findByPk(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (room.generatingImage === 0) {
      return res.status(404).json({ message: "No Image Yet" });
    } else if (room.generatingImage === 1) {
      return res.status(404).json({ message: "Image is generating" });
    } else {
      // room.generatingImage === 2, image is ready
      const image = await Image.findOne({ where: { RoomId: roomId } });
      if (!image || !image.imageFileName) {
        return res.status(404).json({ error: "Image not found" });
      }

      if (!image.imageUrl || image.imageUrlExpiresAt < new Date()) {
        // if no image url or expired, generate new url
        const params = {
          Bucket: process.env["AWS_BUCKET_NAME"],
          Key: image.imageFileName,
        };
        const command = new GetObjectCommand(params);
        const url = await getSignedUrl(s3, command, { expiresIn: 3 * 86400 }); // expire in 3 days
        image.imageUrl = url;
        image.imageUrlExpiresAt = new Date(Date.now() + 3 * 86400 * 1000); // 3 days
        await image.save();

        io.emit(`image-${roomId}`, { imageUrl: url });
        return res.status(200).json({ imageUrl: url });
      } else {
        // get image url
        const imageUrl = image.imageUrl;
        return res.status(200).json({ imageUrl: imageUrl });
      }
    }
  } catch (error) {
    return res.status(500).send({ error: error });
  } finally {
    // release the lock so that other requests can get/generate image
    release();
  }
});
