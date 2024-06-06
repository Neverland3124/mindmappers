# CSCC09 Project Proposal

## Project Title
Mind Mappers

## Team Name
VertoHealthJuniors

## Team Members
- Zhitao Xu, zhitao.xu@mail.utoronto.ca
- Kaiwei Zhang, kwei.zhang@mail.utoronto.ca 
- Yu Yin Lee, felixyy.lee@mail.utoronto.ca

## Brief Description of the Web Application
Our web application is a collaborative mind mapping tool designed to facilitate real-time brainstorming and idea organization for individuals and teams. The application leverages modern web technologies to provide a seamless and interactive user experience, ensuring that users can easily create, modify, and share their mind maps. Key features include a Single Page Application (SPA) front end built with Angular, a robust backend powered by Express, and seamless integration with third-party services like ChatGPT.

## Table of Contents
1. [Required Elements](#required-elements)
2. [Additional Requirements](#additional-requirements)
3. [Development Milestones](#development-milestones)

## Required Elements
- **Modern Frameworks**: Utilize Angular to build a dynamic and responsive SPA, ensuring a smooth user experience.
- **Frontend as SPA**: The frontend is implemented as a Single Page Application (SPA) for fast and efficient user interactions.
- **Express Backend**: Use Express.js as the core backend API framework to handle requests and serve the application.
- **RESTful API**: Implement RESTful API endpoints to manage mind map data, user authentication, and other application functionalities.
- **Docker Deployment**: Containerize the application using Docker for consistent and scalable deployment across different environments.
- **Mindmap Design**: The website mimics a traditional mind map interface, allowing users to create nodes, link them, and organize ideas visually.
- **Third-Party API (ChatGPT)**: Integrate with ChatGPT to enable advanced features such as generating content or suggestions within the mind maps.
- **OAuth 2.0**: Implement OAuth 2.0 for secure and standardized user authentication and authorization.

## Additional Requirements
- **Webhook Integration**: Implement webhooks to receive notifications from external services. For example, trigger updates when a collaborative mind map is modified by another user.
- **Real-Time Collaboration**: Use WebSockets to enable real-time updates, allowing multiple users to work on the same mind map simultaneously and see each other’s changes live.
- **Long-Running Task Handling**: Offload tasks such as exporting mind maps to images to background workers using a job queue (e.g., Bull for Node.js). Provide users with progress updates and notify them upon completion.

## Development Milestones

### Alpha Version Milestones
- Basic mind map features: Create and organize objects (nodes).
- Implement drag-and-drop functionality for easy node manipulation.
- Enable linking between nodes to show relationships.
- Develop a sign-in/sign-up system using OAuth 2.0.

### Beta Version Milestones
- Introduce real-time collaboration features to allow multiple users to work on the same mind map simultaneously.
- Enhance the user interface and enable the creation of various types of objects.
- Deploy the application using Docker for consistent environments.
- Integrate with ChatGPT APIs to generate content or suggestions within mind maps.

### Final Version Milestones
- Refine and improve features from the Alpha and Beta versions.
- Add export functionality to save mind maps as images, texts, or other file formats.
- Implement webhooks to receive and handle notifications from external services, enhancing real-time collaboration and updates.
