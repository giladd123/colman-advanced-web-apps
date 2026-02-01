//Gilad-Tidhar-325767929-Ofek-Morali-322494287
import initApp from "./src/app";
import mongoose from "mongoose";
import type { Server } from "http";
import type { Express } from "express";

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

initApp()
  .then((app: Express) => {
    process.on("SIGINT", gracefulShutdown).on("SIGTERM", gracefulShutdown);

    const port = process.env.PORT || 8080;

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
  })
  .catch((error) => {
    console.error("Failed to initialize app:", error);
    process.exit(1);
  });
