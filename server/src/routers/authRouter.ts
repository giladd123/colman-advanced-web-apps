import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/authController";
import {
  validateLogin,
  validateRegister,
  validateRefreshToken,
} from "../middleware/authValidator";

export const authRouter = Router();

authRouter.post("/register", validateRegister, register);
authRouter.post("/login", validateLogin, login);
authRouter.post("/refresh", validateRefreshToken, refresh);
authRouter.post("/logout", validateRefreshToken, logout);
