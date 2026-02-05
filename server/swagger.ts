const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "My API",
    description: "API documentation",
  },
  host: "localhost:3000",
  schemes: ["http"],
  tags: [
    { name: "Comments", description: "Endpoints for comments" },
    { name: "Posts", description: "Endpoints for posts" },
    { name: "Users", description: "Endpoints for users" },
    { name: "Auth", description: "Endpoints for authentication" },
  ],
  securityDefinitions: {
    bearerAuth: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description: "Enter: Bearer <token>",
    },
  },
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/routers/postRouter.ts", "./src/routers/commentRouter.ts", "./src/routers/userRouter.ts", "src/routers/authRouter.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);
