import { Router } from "express";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { isAuthenticated } from "../middleware/auth.js";
import { io } from "../app.js";
import { Webhook } from "../models/webhooks.js";
import dotenv from "dotenv";
dotenv.config();

export const webhookRouter = Router();

// response {
//   headers: {
//     'cache-control': 'no-cache, private',
//     'cf-cache-status': 'DYNAMIC',
//     'cf-ray': '89ecd029fb61ab75-YYZ',
//     connection: 'keep-alive',
//     'content-type': 'text/html; charset=UTF-8',
//     date: 'Sat, 06 Jul 2024 04:22:20 GMT',
//     server: 'cloudflare',
//     'strict-transport-security': 'max-age=31536000; includeSubDomains',
//     'transfer-encoding': 'chunked',
//     'x-apiquota-remaining': '92',
//     'x-apiquota-reset': '2024-07-07T00:00:00Z',
//     'x-message-id': '6688c67cf7b7fa47ed95cb6a',
//6688c67cf7b7fa47ed95cb6a
//     'x-ratelimit-limit': '10',
//     'x-ratelimit-remaining': '8'
//   },
//   body: '',
//   statusCode: 202
// }

// body
// {
//   "url": "https://backend.neverland3124.me/api/webhooks",
//   "data": {
//       "id": "6688c15f47bae6fb03123133",
//       "type": "opened",
//       "email": {
//           "id": "6688c0c58c52d7368ab3ec4c",
//           "from": "invite@trial-351ndgwmx5rlzqx8.mlsender.net",
//           "tags": [
//               "1"
//           ],
//           "object": "email",
//           "status": "delivered",
//           "headers": null,
//           "message": {
//               "id": "6688c0c5210aedad12031b1e",
//               "object": "message",
//               "created_at": "2024-07-06T03:57:57.000000Z"
//           },
//           "subject": "MindMappers Invitation",
//           "recipient": {
//               "id": "66886267125a916c5d30adb6",
//               "email": "xuzhitao200020612@gmail.com",
//               "object": "recipient",
//               "created_at": "2024-07-05T21:15:19.000000Z"
//           },
//           "created_at": "2024-07-06T03:57:57.000000Z"
//       },
//       "morph": {
//           "id": "6688c15fdba5adb74528f336",
//           "ip": "74.125.215.67",
//           "object": "open",
//           "created_at": "2024-07-06T04:00:31.000000Z"
//       },
//       "object": "activity",
//       "created_at": "2024-07-06T04:00:31.000000Z",
//       "template_id": "3vz9dle0me7gkj50"
//   },
//   "type": "activity.opened_unique",
//   "domain_id": "jy7zpl9d235g5vx6",
//   "created_at": "2024-07-06T04:01:28.743800Z",
//   "webhook_id": "x2p0347mrp4zdrn7"
// }

// {
//   "url": "https://backend.neverland3124.me/api/webhooks",
//   "data": {
//       "id": "6688ab1ae07726fc64df832a",
//       "type": "delivered",
//       "email": {
//           "id": "6688ab0c6d42d2348808d731",
//           "from": "invite@trial-351ndgwmx5rlzqx8.mlsender.net",
//           "tags": null,
//           "object": "email",
//           "status": "delivered",
//           "headers": null,
//           "message": {
//               "id": "6688ab0b7cd68035395036d0",
//               "object": "message",
//               "created_at": "2024-07-06T02:25:15.000000Z"
//           },
//           "subject": "MindMappers Invitation",
//           "recipient": {
//               "id": "66885de43b7c865eaa4d160f",
//               "email": "healthverto@gmail.com",
//               "object": "recipient",
//               "created_at": "2024-07-05T20:56:04.000000Z"
//           },
//           "created_at": "2024-07-06T02:25:16.000000Z"
//       },
//       "morph": null,
//       "object": "activity",
//       "created_at": "2024-07-06T02:25:23.000000Z",
//       "template_id": "3vz9dle0me7gkj50"
//   },
//   "type": "activity.delivered",
//   "domain_id": "jy7zpl9d235g5vx6",
//   "created_at": "2024-07-06T02:25:33.562766Z",
//   "webhook_id": "x2p0347mrp4zdrn7"
// }

webhookRouter.post("/", async (req, res, next) => {
  try {
    console.log("Webhook received", req.body);
    // parse the information out and send it to the frontend via socket.io
    const messageId = req.body.data.email.message.id; // three cases: delivered, open_unique, click_unique (after bind to a domain)
    if (!messageId) {
      console.log("cannot find messageId");
      return res.status(400).json({ message: "Invalid webhook" });
    }
    let webhook = await Webhook.findOne({
      where: {
        webhookId: messageId,
      },
    });
    if (!webhook) {
      console.log("Webhook not found, continue to show webhook as test mode");
      webhook = await Webhook.findOne({
        order: [["createdAt", "DESC"]], // get the last one
      });
      //   return res.status(400).json({ message: "Invalid webhook" });
    } else {
      console.log("webhook", webhook);
    }
    console.log("req.body.type", req.body.type);
    if (req.body.type === "activity.opened_unique") {
      io.emit("webhook-opened", { webhook: webhook });
    } else {
      io.emit("webhook-delivered", { webhook: webhook });
    }
    return res.status(200).json({ message: "Webhook received" });
  } catch (error) {
    return res.status(500).send({ error: error });
  }
});

webhookRouter.post("/invite", isAuthenticated, async (req, res, next) => {
  // we will be taking the receiver email from the request body
  // use userid to get the sender email
  console.log("received invite request", req.body, req.userId, req.userEmail);
  const { name, email, roomName } = req.body;
  const userId = req.userId;
  const userEmail = req.userEmail;
  try {
    // return res.status(400).json({ message: "Email sent" });

    const mailerSend = new MailerSend({
      apiKey:
        // "mlsn.99b1d6a7237d7186df404f4ad56fb46b8c038a0a8e444cdb3ecb0f9fb16e336f",
        "mlsn.0e4ea7fdaad7b992470822a0eb585f526b542e36185d703d7521dcac18debd82",
      // TODO: get apikey from dotenv
    });
    // can only send emails using the verified domain, now is a trial domain
    const sentFrom = new Sender(
      // we can only sent from a verified domain
      "invite@felixlyy.me",
      userEmail
    );

    // can send to different emails
    const recipients = [
      // new Recipient("xuzhitao200020612@gmail.com", "Your Client zhitao"),
      new Recipient(email, name),
    ];

    console.log("action url is:", process.env.ORIGIN);

    const variables = [
      {
        email: email,
        substitutions: [
          {
            var: "email",
            value: userEmail,
          },
          {
            var: "room_name",
            value: roomName,
          },
          {
            var: "action_url",
            value: process.env.ORIGIN || "https://frontend.neverland3124.me",
          },
          {
            var: "friend_name",
            value: name,
          },
        ],
      },
    ];

    // const emailParams = new EmailParams()
    //   .setFrom(sentFrom)
    //   .setTo(recipients)
    //   .setReplyTo(sentFrom)
    //   .setSubject("MindMappers Invitation")
    //   .setTemplateId("3vz9dle0me7gkj50") // TemplateId from MailerSend
    //   .setVariables(variables);
    const customHeaders = [
      { name: "X-Custom-Header", value: "HeaderValue" },
      { name: "X-Tracking-ID", value: "track123" },
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject("MindMappers Invitation")
      .setTemplateId("3vz9dle0me7gkj50")
      // .setTags([userId.toString()])
      .setVariables(variables);
    // setTags to identify the sender

    const response = await mailerSend.email.send(emailParams);
    // 202 accept
    const webhookId = response.headers["x-message-id"];
    // store the webhookId to the database
    await Webhook.create({
      webhookId: webhookId,
      friendName: name,
      friendEmail: email,
      roomName: roomName,
      UserId: userId,
      userEmail: userEmail,
    });
    console.log("response", response);
    return res.status(200).json({ message: "Email sent" });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ error: error });
  }
});
