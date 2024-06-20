# MindMappers Project Proposal

## Table of Contents
1. [Project Title](#project-title)
2. [Team Name](#team-name)
3. [Team Members](#team-members)
4. [Brief Description](#brief-description)
5. [Required Elements](#required-elements)
6. [Additional Requirements](#additional-requirements)
7. [Alpha Version Milestones](#alpha-version-milestones)
8. [Beta Version Milestones](#beta-version-milestones)
9. [Final Version Milestones](#final-version-milestones)

## Project Title
MindMappers

## Team Name
VertoHealthJuniors

## Team Members
- Zhitao Xu: [zhitao.xu@mail.utoronto.ca](mailto:zhitao.xu@mail.utoronto.ca)
- Kaiwei Zhang: [kwei.zhang@mail.utoronto.ca](mailto:kwei.zhang@mail.utoronto.ca)
- Yu Yin Lee: [felixyy.lee@mail.utoronto.ca](mailto:felixyy.lee@mail.utoronto.ca)

## Brief Description
Our web application is a collaborative mind-mapping tool designed to facilitate real-time brainstorming and idea organization for individuals and teams. The application leverages modern web technologies to provide a seamless and interactive user experience, ensuring that users can easily create, modify, and share their mind maps. Key features include a Single Page Application (SPA) front end built with Angular, a robust backend powered by Express, and seamless integration with third-party services like ChatGPT.

## Required Elements
- **Use modern frameworks**
  - Frontend is written in SPA
- **Use Express as core backend API**
  - [Express](https://expressjs.com/)
- **Use RESTful API**
- **Deploy using Docker**
- **Use third-party API such as ChatGPT**
  - During dragging, the text is sent to ChatGPT, which provides an image to display
  - [ChatGPT API](https://platform.openai.com/docs/api-reference/audio/createSpeech)
- **Use OAuth 2.0 as the sign-in system**
  - Google OAuth2 is chosen to be the authorization mechanism
  - [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)

## Additional Requirements
- **Use webhook**
  - Implement webhooks to receive notifications from external services
  - Use webhook to trigger email updates when another user modifies your collaborative mind map
  - Technology: SendGrid
  - [SendGrid](https://sendgrid.com/en-us/pricing)
- **Real-time collaboration**
  - Different users can work on the same mind map board and see each other’s movements and changes
  - Socket.io: To connect users that join the same room for a mindmap
  - [Socket.io](https://socket.io/docs/v4/)

## Alpha Version Milestones
- Finish basic features of mind map
  - Create object
  - 1 object is created and displayed in this milestone
- Setup backend database
- Drag and drop feature
  - [Angular CDK Drag and Drop](https://material.angular.io/cdk/drag-drop/overview)
- Link feature
  - Use ctx package to draw the line
  - [Canvas API Drawing Shapes](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)
- Sign-in / up system
  - Use Google OAuth2 to login

## Beta Version Milestones
- Real-time feature to allow people to collaborate on the mind map board
  - Use Socket.io
- Improve UI and be able to create different objects
- Deployment
- Link to ChatGPT APIs to generate pictures

## Final Version Milestones
- Improvement on features mentioned in Alpha and Beta Versions
- Webhook
  - Use SendGrid to send emails to owners of the mind map
- Export functionalities if we still have time (As Images / Texts OR other file types)
