import connectToDatabase from "./src/utils/database";
import express from "express";
import mongoose from "mongoose";
import { postRouter } from "./src/routers/postRouter";
import { authRouter } from "./src/routers/authRouter";
import { commentRouter } from "./src/routers/commentRouter";
import type { Server } from "http";
import { ensureEnv } from "./src/utils/ensureEnv";

let server: Server;

function gracefulShutdown() {
  console.log("Received shutdown signal, closing server gracefully...");

  server.close((err) => {
    if (err) {
      console.error("Error during server shutdown:", err);
      process.exit(1);
    }

    console.log("Server closed, all requests completed");
    mongoose.connection.close();
    console.log("Mongoose connection closed through app termination");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forcefully shutting down after timeout");
    process.exit(1);
  }, 10000);
}

process.loadEnvFile();

const main = async () => {
  ensureEnv(["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"]);
  await connectToDatabase();
  console.log("Connected to DB");
  process.on("SIGINT", gracefulShutdown).on("SIGTERM", gracefulShutdown);

  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  const port = process.env.PORT || 8080;

  app.use("/auth", authRouter);
  app.use("/posts", postRouter);
  app.use("/comments", commentRouter);

  server = app.listen(port, () => {
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
