# CSCC09 Project Proposal

## Project Title: MindMappers

## Team Name: VertoHealthJuniors

## Team Members

- Zhitao Xu: zhitao.xu@mail.utoronto.ca
- Yu Yin Lee: felixyy.lee@mail.utoronto.ca
- ~~Kaiwei Zhang: kwei.zhang@mail.utoronto.ca~~

## Deployment URL

URL: [https://www.mindmappers.felixlyy.me](https://www.mindmappers.felixlyy.me)

## Explanation URL (YouTube Link)

URL: [https://youtu.be/Z9pXDaztqt8](https://youtu.be/Z9pXDaztqt8)

## Brief Description of the Web Application

Our web application is a collaborative mind-mapping tool designed to facilitate real-time brainstorming and idea organization for individuals and teams. The application leverages modern web technologies to provide a seamless and interactive user experience, ensuring that users can easily create, modify, and share their mind maps. Key features include a Single Page Application (SPA) front end built with Angular, a robust backend powered by Express, and seamless integration with third-party services like OPENAI DALLE.

## Table of Contents

- [CSCC09 Project Proposal](#cscc09-project-proposal)
  - [Project Title: MindMappers](#project-title-mindmappers)
  - [Team Name: VertoHealthJuniors](#team-name-vertohealthjuniors)
  - [Team Members](#team-members)
  - [Deployment URL](#deployment-url)
  - [Explanation URL (YouTube Link)](#explanation-url-youtube-link)
  - [Brief Description of the Web Application](#brief-description-of-the-web-application)
  - [Table of Contents](#table-of-contents)
  - [Required Elements](#required-elements)
  - [Additional Requirements](#additional-requirements)
  - [Alpha Version Milestones](#alpha-version-milestones)
  - [Beta Version Milestones](#beta-version-milestones)
  - [Final Version Milestones](#final-version-milestones)

## Required Elements

- **Use modern frameworks**
  - Frontend is written in SPA.
- **Use Express as core backend API**
  - [ExpressJS](https://expressjs.com/)
- **Use RESTful API**
  - Yes
- **Deploy using Docker**
  - Yes
- **Use third-party API such as OpenAI**
  - We have the generate image and show image button to generate an OpenAI DALLE 3 AI image for the current board.
    - [OpenAI API](https://platform.openai.com/docs/guides/images/usage)
  - Also, we use AWS S3 Bucket to store generated images.
    - [AWS S3 API](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-node-examples.html)
- **Use OAuth 2.0 as the sign-in system**
  - Google OAuth2 is chosen to be the authorization mechanism.
  - [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)

## Additional Requirements

- **Use webhook**
  - When a board owner sends a link invite to other users, and the invited user clicks on the link to join the board, ~~SendGrid~~ (Mailersend) will notify the server. As a result, the board owner will be specifically informed that the email is successfully delivered or the invited user has clicked the link.
  - ~~[SendGrid](https://sendgrid.com/en-us/pricing)~~
    - ~~This is no longer applicable as SendGrid does not allow us to create a new account.~~
  - [MailerSend](https://www.mailersend.com/)
    - As a result, we use MailerSend as a replacement for webhook.
- **Real-time can be fulfilled by socket protocol**
  - Different users can work on the same mind map board and see each other’s movements and changes. They also have real-time information about current rooms on the room page.
  - Socket io: To connect users that join the same room for a mind map.
  - [Socket.io](https://socket.io/docs/v4/)
- **Long Running Task**
  - Task queue is implemented for generating AI images.
    - Use [BullMQ](https://www.npmjs.com/package/bullmq) to send work to Redis.
  - A worker is established for handling requests from Redis.

## Alpha Version Milestones

- **Finish those basic features of mind map**
  - Create object: 1 object is created and displayed in this milestone.
- **Setup backend database**
  - Use local SQLite with Sequelize for storing tokens of OAuth2 as the alpha version.
- **Drag and drop feature**
  - [Angular Drag and Drop](https://material.angular.io/cdk/drag-drop/overview)
- **Link feature**
  - Use the ctx package to draw the line.
  - [Canvas API Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)
- **Sign-in / up system**
  - Use Google OAuth2 to sign in.

## Beta Version Milestones

- **Real-time feature to allow people to collaborate on the mind map board**
  - Use socket io.
- **Deployment by Docker**
  - [Docker](https://docs.docker.com/get-docker/)
  - AWS Lightsail
  - CI/CD
- **Change from using local SQLite to PostgreSQL and deploy with Docker**
  - [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- **OPENAI APIs to generate pictures**

## Final Version Milestones

- **Improvement on features mentioned in Alpha and Beta Versions**
  - We use [GoJS](https://gojs.net/latest/index.html) as the diagram for the mindmap page instead to allow more advanced features and functionalities.
- **Webhook**
  - MailerSend to send emails to invite people to the mindmap.
  - We updated the webhook feature and fixed some issues.
- **Import Export Functionalities**
  - Export as a JSON file.
  - Import JSON file to show the diagram.
- **Image Generation**
  - Implement AI Image Generation for a mindmap board.
  - Connect to OpenAI DALLE 3 API.
  - Store generated images in AWS S3 Bucket Storage.
  - Users can generate new images for the board or get the existing generated image.
- **Free Trial Access**
  - Users can log in as a free trial account.
- **Improve UI**
  - Implement the loading stage and improve the UI of the front page and inner pages.
