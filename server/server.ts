import initApp from "./src/app";
import mongoose from "mongoose";
import type { Server } from "http";
import type { Express } from "express";
import https from "https";
import http from "http";
import fs from "fs";

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

    if (process.env.NODE_ENV !== "production") {
            console.log('Running in development mode with HTTP');
            server = http.createServer(app).listen(process.env.PORT);
        } else {
            console.log('Running in PRODUCTION mode with HTTPS');
            const sslOptions = {
                key: fs.readFileSync('../ssl/client-key.pem'),
                cert: fs.readFileSync('../ssl/client-cert.pem')
            };
           
            // const localHttpsPort = 3443; // Override port for local HTTPS testing
            // server = https.createServer(sslOptions, app).listen(localHttpsPort, () => {
            //     console.log(`Server running on https://localhost:${localHttpsPort}`);
            // });
    
            https.createServer(sslOptions, app).listen(process.env.PORT);
        }

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${process.env.PORT} is already in use. Exiting.`);
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
