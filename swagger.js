const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "My API",
    description: "API documentation"
  },
  host: "localhost:3000",
  schemes: ["http"]
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./src/routers/postRouter.ts", "./src/routers/commentRouter.ts"];

swaggerAutogen(outputFile, endpointsFiles, doc);
