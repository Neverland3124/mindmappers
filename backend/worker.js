import { Worker } from "bullmq";
import { sequelize } from "./datasource.js";
import OpenAI from "openai";
import { Object } from "./models/objects.js";
import { Image } from "./models/images.js";
import { Room } from "./models/rooms.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import axios from "axios";

import "dotenv/config";
// same as
// import dotenv from "dotenv";
// dotenv.config();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const s3 = new S3Client({
  // Note: we don't need add credentials here but we need them in the environment variables
  // credentials: {
  //   accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
  //   secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
  // },
  region: process.env["AWS_REGION"],
});

try {
  await sequelize.authenticate();
  console.log("Worker connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database for worker:", error);
}

async function imagePrompt(jobData) {
  const { roomId, roomName, roomDescription } = jobData;
  const nodes = await Object.findAll({ where: { RoomId: roomId } });
  const texts = nodes.map((node) => node.text);

  const prompt = `
    Generate an image of brainstorm mindmap for the room named "${roomName}". The room description is "${roomDescription}". It includes the following nodes: ${texts.join(", ")} (use the meaningful ones with previous name and description). The mind map should visually represent the connections and themes described by these nodes. Use a clear and organized layout with colorful and engaging visuals to highlight the different aspects of the mind map, be creative and bold on creating the image.
  `;
  return prompt;
}

async function imageGeneration(prompt) {
  try {
    const image = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      size: "1024x1024",
      n: 1,
      response_format: "url",
    });
    const created = image.created;
    const imageUrl = image.data[0].url;
    return { imageUrl, created };
  } catch (error) {
    console.error("Error generating image:", error);
  }
}

async function downloadUrlAndStore(roomId, date, url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const filename = `images/${roomId}-${date}.png`;
    const params = {
      Bucket: process.env["AWS_BUCKET_NAME"],
      Key: filename,
      Body: response.data,
      ContentType: "image/png",
    };
    const command = new PutObjectCommand(params);
    const s3response = await s3.send(command);

    if (s3response.$metadata.httpStatusCode === 200) {
      const oldImages = await Image.findAll({ where: { RoomId: roomId } });
      if (oldImages.length > 0) {
        // delete the old images from the database
        await Image.destroy({ where: { RoomId: roomId } });
        // delete the old images from the s3 bucket
        for (const oldImage of oldImages) {
          const oldFilename = oldImage.imageFileName;
          const deleteParams = {
            Bucket: process.env["AWS_BUCKET_NAME"],
            Key: oldFilename,
          };
          const deleteCommand = new DeleteObjectCommand(deleteParams);
          await s3.send(deleteCommand);
        }
      }
      // add the new image to the database
      const image = await Image.create({
        imageFileName: filename,
        RoomId: roomId,
      });

      // change the room status to have file in s3 bucket
      await Room.update(
        {
          generatingImage: 2,
        },
        {
          where: {
            id: roomId,
          },
        },
      );
      return image.id;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error uploading image to S3:", error);
    return null;
  }
}

async function onImageCreated(jobData) {
  try {
    const prompt = await imagePrompt(jobData);
    const roomId = jobData.roomId;
    const { imageUrl, created } = await imageGeneration(prompt);
    await downloadUrlAndStore(roomId, created, imageUrl);
    return;
  } catch (error) {
    // set Image generation status to no image
    await Room.update(
      {
        generatingImage: 0,
      },
      {
        where: {
          id: roomId,
        },
      },
    );
    console.error("Error onImageCreated:", error);
  }
}

const jobsHandlers = {
  ImageCreate: onImageCreated,
};

const imagesWorker = new Worker(
  "Images",
  async (job) => {
    const handler = jobsHandlers[job.name];
    if (handler) {
      return handler(job.data);
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    },
    concurrency: 1, // Set concurrency to 1 to process one job at a time
  },
);
