import dotenv from "dotenv";
import connectToDatabase from "./utils/database";
import express, { Express } from "express";
import { postRouter } from "./routers/postRouter";
import { authRouter } from "./routers/authRouter";
import { commentRouter } from "./routers/commentRouter";
import { userRouter } from "./routers/userRouter";
import { ensureEnv } from "./utils/ensureEnv";
import swaggerUi from "swagger-ui-express";
import swaggerFile from "../swagger-output.json"; 

const initApp = (): Promise<Express> => {
  return new Promise((resolve, reject) => {
    // Load environment variables based on NODE_ENV
    if (process.env.NODE_ENV === "test") {
      dotenv.config({ path: ".env.test" });
    } else {
      dotenv.config();
    }

    ensureEnv(["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"]);

    connectToDatabase()
      .then(() => {
        console.log("Connected to DB");

        const app = express();
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.use("/auth", authRouter);
        app.use("/posts", postRouter);
        app.use("/comments", commentRouter);
        app.use("/users", userRouter);
        app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

        resolve(app);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default initApp;
