import { Router } from "express";
import { Queue } from "bullmq";
import { Image } from "../models/images.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client } from "@aws-sdk/client-s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Mutex } from "async-mutex";

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

imageRouter.post("/", async (req, res) => {
  // Request to generate image from text
  console.log("image router line 77 post / req.body:", req.body);
  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: "Text and RoomId is required" });
  }
  try {
    const image = await Image.findOne({ where: { RoomId: roomId } });
    if (!image) {
      // create a new image
    } else {
      // regenerate the image

      // set generating image status to 1
      if (image.isImageReady === 1) {
        return res.status(409).json({
          error:
            "An image is currently being generated for this room. Please wait.",
        });
      }
      image.isImageReady = 1;
      await image.save();
    }

    imagesQueue.add("ImageCreate", {
      roomId: roomId, // only pass the roomId to the worker
    });

    return res.status(202).json({
      message: `Request received, generate a image for room with id: ${roomId}.`,
    });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

imageRouter.get("/", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) {
    return res.status(400).json({ error: "RoomId is required" });
  }

  const release = await mutex.acquire();
  try {
    const image = await Image.findOne({ where: { RoomId: roomId } });
    if (!image) {
      return res.status(404).json({ error: "No Image Yet" });
    }
    // in image, have a field indicate the status of the image
    if (image.isImageReady === 1) {
      return res.status(404).json({ message: "Image is generating" });
    } else {
      if (!image.imageFileName) {
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
        console.log("image rounter line 106 get image url:", url);
        image.imageUrl = url;
        image.imageUrlExpiresAt = new Date(Date.now() + 3 * 86400 * 1000); // 3 days
        await image.save();

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
