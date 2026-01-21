import connectToDatabase from "./src/utils/database";
import express from "express";
import mongoose from "mongoose";
import { postRouter } from "./src/routers/postRouter";

function gracefulShutdown() {
  mongoose.connection.close();
  console.log("Mongoose connection closed through app termination");
}

process.loadEnvFile();

const main = async () => {
  await connectToDatabase();
  console.log("Connected to DB");
  process.on("SIGINT", gracefulShutdown).on("SIGTERM", gracefulShutdown);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const port = process.env.PORT || 8080;

  app.use("/posts", postRouter);
  const server = app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Exiting.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
};

main();
