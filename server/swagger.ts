import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "API documentation",
    },
    tags: [
      { name: "Auth", description: "Endpoints for authentication" },
      { name: "Posts", description: "Endpoints for posts" },
      { name: "Comments", description: "Endpoints for comments" },
      { name: "Users", description: "Endpoints for users" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            profileImage: { type: "string" },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userID: { type: "string" },
            content: { type: "string" },
            image: { type: "string" },
            likesCount: { type: "integer" },
            commentsCount: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Comment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            postID: { type: "string" },
            userID: { type: "string" },
            content: { type: "string" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: [
    "./src/routers/authRouter.ts",
    "./src/routers/postRouter.ts",
    "./src/routers/commentRouter.ts",
    "./src/routers/userRouter.ts",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
