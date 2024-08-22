import { Worker } from "bullmq";
import { sequelize } from "./datasource.js";
import OpenAI from "openai";
// import { Object } from "./models/objects.js";
import { Image } from "./models/images.js";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import axios from "axios";
import { initGrpcClient, getRoomInfo } from "./grpc-room-client.js";

// Initialize the gRPC client
initGrpcClient();

import "dotenv/config";
// same as
// import dotenv from "dotenv";
// dotenv.config();

// Initialize the sequelize connection
try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } }); // This method is used to synchronize all defined models with the database
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

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

async function imagePrompt(roomId) {
  try {
    const response = await new Promise((resolve, reject) => {
      getRoomInfo(roomId, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });

    const { roomName, roomDescription, roomNodes } = response;
    const prompt = `
      Generate an image of brainstorm mindmap for the room named "${roomName}". The room description is "${roomDescription}". It includes the following nodes: "${roomNodes}" (use the meaningful ones with previous name and description). The mind map should visually represent the connections and themes described by these nodes. Use a clear and organized layout with colorful and engaging visuals to highlight the different aspects of the mind map, be creative and bold on creating the image.
    `;
    console.log("worker line 46: prompt:", prompt);
    return prompt;
  } catch (error) {
    console.error("Failed to get room info:", error);
    return null; // null indicates that there was an error
  }
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
    console.log("worker line 60: imageUrl:", imageUrl);
    return { imageUrl, created };
  } catch (error) {
    console.error("Error generating image:", error);
  }
}

// we will store the image in s3 bucket
// if the image is successfully stored, we will remove all the old images from the s3 bucket and also from our database
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
            // Delete: { // Delete
            //   Objects: [ // ObjectIdentifierList // required
            //     { // ObjectIdentifier
            //       Key: "STRING_VALUE", // required
            //       VersionId: "STRING_VALUE",
            //     },
            //   ],
            //   Quiet: true || false,
            // },
          };
          // new DeleteObjectsCommand(deleteParams);
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
      await Image.update(
        {
          isImageReady: 2,
        },
        {
          where: {
            RoomId: roomId,
          },
        }
      );
      // await Room.update(
      //   {
      //     generatingImage: 2,
      //   },
      //   {
      //     where: {
      //       id: roomId,
      //     },
      //   },
      // );
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
  console.log("onImageCreated, jobData:", jobData);
  try {
    const roomId = jobData.roomId;
    const prompt = await imagePrompt(roomId);
    if (!prompt) {
      console.error("Issue with gRPC call to get room info");
      await Image.update(
        {
          isImageReady: 0,
        },
        {
          where: {
            RoomId: roomId,
          },
        }
      );
      return;
    }
    console.log("prompt created");

    // await Image.update(
    //   {
    //     isImageReady: 2,
    //   },
    //   {
    //     where: {
    //       RoomId: roomId,
    //     },
    //   }
    // );
    // return;

    // const imageUrl = "https://oaidalleapiprodscus.blob.core.windows.net/private/org-ydkBgigFsFrsFvTGF5IUMMeR/user-2y4kN8lluHrcuUAIiMDOk1Dn/img-OtvTck7hB0TiMA1gD3zURgC1.png?st=2024-08-14T03%3A52%3A37Z&se=2024-08-14T05%3A52%3A37Z&sp=r&sv=2023-11-03&sr=b&rscd=inline&rsct=image/png&skoid=d505667d-d6c1-4a0a-bac7-5c84a87759f8&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2024-08-13T21%3A34%3A25Z&ske=2024-08-14T21%3A34%3A25Z&sks=b&skv=2023-11-03&sig=TN%2BG12gFQNn21jZtrWQaBb4yrdtB3bMbF4df18l9G%2B4%3D";
    // const created = Date.now().toString();
    const { imageUrl, created } = await imageGeneration(prompt);
    await downloadUrlAndStore(roomId, created, imageUrl);
    return;
  } catch (error) {
    // set Image generation status to no image

    await Image.update(
      {
        isImageReady: 0,
      },
      {
        where: {
          RoomId: roomId,
        },
      }
    );
    // await Room.update(
    //   {
    //     generatingImage: 0,
    //   },
    //   {
    //     where: {
    //       id: roomId,
    //     },
    //   }
    // );
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
  }
);
