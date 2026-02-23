import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import connectToDatabase from "./utils/database";
import express, { Express } from "express";
import { postRouter } from "./routers/postRouter";
import { authRouter } from "./routers/authRouter";
import { commentRouter } from "./routers/commentRouter";
import { userRouter } from "./routers/userRouter";
import { ensureEnv } from "./utils/ensureEnv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../swagger";

const initApp = (): Promise<Express> => {
  return new Promise((resolve, reject) => {
    // Load environment variables based on NODE_ENV
    if (process.env.NODE_ENV === "test") {
      dotenv.config({ path: ".env.test" });
    } else {
      dotenv.config();
    }

    ensureEnv(["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET", "GOOGLE_CLIENT_ID"]);

    connectToDatabase()
      .then(() => {
        console.log("Connected to DB");

        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Serve uploaded files
        app.use("/uploads", express.static(uploadsDir));

        // API routes
        app.use("/api/auth", authRouter);
        app.use("/api/posts", postRouter);
        app.use("/api/comments", commentRouter);
        app.use("/api/users", userRouter);
        app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        // Serve frontend in production
        if (process.env.NODE_ENV === "production") {
          const clientBuildPath = path.join(__dirname, "../../client/dist");
          app.use(express.static(clientBuildPath));
          app.get("*", (_req, res) => {
            res.sendFile(path.join(clientBuildPath, "index.html"));
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
