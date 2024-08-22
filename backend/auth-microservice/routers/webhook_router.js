import { Router } from "express";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
// import { io } from "../app.js";
import { Webhook } from "../models/webhooks.js";
import dotenv from "dotenv";
dotenv.config();

export const webhookRouter = Router();

webhookRouter.post("/", async (req, res, next) => {
  try {
    const messageId = req.body.data.email.message.id;
    // three cases: delivered, click
    if (!messageId) {
      return res.status(400).json({ message: "Invalid webhook" });
    }

    let webhook = await Webhook.findOne({
      where: {
        webhookId: messageId,
      },
    });

    if (!webhook) {
      // Webhook not found, continue to show webhook as test mode
      webhook = await Webhook.findOne({
        order: [["createdAt", "DESC"]], // get the last one
      });
    }

    if (req.body.type === "activity.delivered") {
      // io.emit("webhook-delivered", { webhook: webhook });
    } else {
      // io.emit("webhook-clicked", { webhook: webhook });
    }
    return res.status(200).json({ message: "Webhook received" });
  } catch (error) {
    return res
      .status(500)
      .send({ error: `Error when receiving webhook: ${error}` });
  }
});

webhookRouter.post("/invite", async (req, res, next) => {
  const { name, email, roomName, roomId } = req.body;
  const userId = parseInt(req.headers['x-user-id']);
  const userEmail = req.headers['x-user-email'];
  const sender = req.headers['x-user-name'];
  try {
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });

    const sentFrom = new Sender("invite@felixlyy.me", userEmail);

    const recipients = [new Recipient(email, name)];

    let action_url = process.env.ORIGIN || "http://localhost:4200";
    action_url = action_url + "?roomId=" + roomId;

    const variables = [
      {
        email: email,
        substitutions: [
          {
            var: "sender_name",
            value: sender,
          },
          {
            var: "room_name",
            value: roomName,
          },
          {
            var: "action_url",
            value: action_url,
          },
          {
            var: "friend_name",
            value: name,
          },
        ],
      },
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject("MindMappers Invitation")
      .setTemplateId("3vz9dle0me7gkj50")
      .setVariables(variables);

    const response = await mailerSend.email.send(emailParams);
    // 202 accept
    const webhookId = response.headers["x-message-id"];
    await Webhook.create({
      webhookId: webhookId,
      friendName: name,
      friendEmail: email,
      roomName: roomName,
      UserId: userId,
      userEmail: userEmail,
    });
    return res.status(200).json({ message: "Email sent" });
  } catch (error) {
    return res.status(500).send({ error: `Error when send invite: ${error}` });
  }
});
