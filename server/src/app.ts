import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import connectToDatabase from "./utils/database";
import express, { Express } from "express";
import { postRouter } from "./routers/postRouter";
import { authRouter } from "./routers/authRouter";
import { commentRouter } from "./routers/commentRouter";
import { userRouter } from "./routers/userRouter";
import { ragRouter } from "./routers/ragRouter";
import { ensureEnv } from "./utils/ensureEnv";
import { envFilePath, UPLOADS_DIR, CLIENT_DIST_DIR } from "./utils/paths";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger";

const initApp = (): Promise<Express> => {
  return new Promise((resolve, reject) => {
    // Load environment variables from root .env
    dotenv.config({ path: envFilePath(process.env.NODE_ENV) });

    ensureEnv([
      "DATABASE_URL",
      "JWT_SECRET",
      "JWT_REFRESH_SECRET",
      "GOOGLE_CLIENT_ID",
      "OPENAI_API_KEY",
    ]);

    connectToDatabase()
      .then(() => {
        console.log("Connected to DB");

        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // CORS middleware
        app.use((req, res, next) => {
          res.header("Access-Control-Allow-Credentials", "true");
          next();
        });

        // Ensure uploads directory exists
        if (!fs.existsSync(UPLOADS_DIR)) {
          fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }

        // Serve uploaded files
        app.use("/uploads", express.static(UPLOADS_DIR));

        // API routes
        app.use("/api/auth", authRouter);
        app.use("/api/posts", postRouter);
        app.use("/api/comments", commentRouter);
        app.use("/api/users", userRouter);
        app.use("/api/rag", ragRouter);
        app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        // Serve frontend in production
        if (process.env.NODE_ENV === "production") {
          app.use(express.static(CLIENT_DIST_DIR));
          app.get("/{*path}", (_req, res) => {
            res.sendFile(path.join(CLIENT_DIST_DIR, "index.html"));
          });
        }

        resolve(app);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default initApp;
