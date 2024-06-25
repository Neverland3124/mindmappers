# CSCC09 Project Proposal

## Project Title: MindMappers

## Team Name: VertoHealthJuniors

## Team Members
- Zhitao Xu: zhitao.xu@mail.utoronto.ca
- Kaiwei Zhang: kwei.zhang@mail.utoronto.ca
- Yu Yin Lee: felixyy.lee@mail.utoronto.ca

## Brief Description of the Web Application
Our web application is a collaborative mind-mapping tool designed to facilitate real-time brainstorming and idea organization for individuals and teams. The application leverages modern web technologies to provide a seamless and interactive user experience, ensuring that users can easily create, modify, and share their mind maps. Key features include a Single Page Application (SPA) front end built with Angular, a robust backend powered by Express, and seamless integration with third-party services like ChatGPT.

## Table of Contents
- [Required Elements](#required-elements)
- [Additional Requirements](#additional-requirements)
- [Alpha Version Milestones](#alpha-version-milestones)
- [Beta Version Milestones](#beta-version-milestones)
- [Final Version Milestones](#final-version-milestones)

## Required Elements
- **Use modern frameworks**
  - Frontend is written in SPA.
- **Use Express as core backend API**
  - Link: [Express](https://expressjs.com/)
- **Use RESTful API**
- **Deploy using Docker**
- **Use third-party API such as ChatGPT**
  - During dragging, the text is sent to ChatGPT and gives the image to display.
  - [ChatGPT API](https://platform.openai.com/docs/api-reference/audio/createSpeech)
- **Use OAuth 2.0 as the sign-in system**
  - Google OAuth2 is chosen to be the authorization mechanism.
  - [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)

## Additional Requirements
- **Use webhook**
  - When a board owner sends a link invite to other users, and the invited user clicks on the link to join the board, SendGrid will notify the server. As a result, the board owner will be specifically informed that the invited user has opened the link.
  - [SendGrid](https://sendgrid.com/en-us/pricing)
- **Real-time can be fulfilled by socket protocol**
  - Different users can work on the same mind map board and see each other’s movements and changes.
  - Socket io: To connect users that join the same room for a mind map.
  - [Socket.io](https://socket.io/docs/v4/)

## Alpha Version Milestones
- **Finish those basic features of mind map**
  - Create object: 1 object is created and displayed on this milestone.
- **Setup backend database**
  - Use local SQLite with Sequelize for storing tokens of OAuth2 as alpha version.
- **Drag and drop feature**
  - [Angular Drag and Drop](https://material.angular.io/cdk/drag-drop/overview)
- **Link feature**
  - Use ctx package to draw the line.
  - [Canvas API Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)
- **Sign-in / up system**
  - Use Google OAuth2 to signin.

## Beta Version Milestones
- **Real-time feature to allow people to collaborate on the mind map board**
  - Use socket io.
- **Improve on UI and be able to create different objects**
- **Deployment by Docker**
  - [Docker](https://docs.docker.com/get-docker/)
- **Change from using local SQLite to PostgreSQL and deploy with Docker**
  - [PostgreSQL Docker](https://hub.docker.com/_/postgres)
- **Link to ChatGPT APIs to generate pictures**

## Final Version Milestones
- **Improvement on features mentioned in Alpha and Beta Versions**
- **Webhook**
  - SendGrid to send emails to owners of the mind map.
- **Export Functionalities if we still have time**
  - Export as images, texts, or other file types.
