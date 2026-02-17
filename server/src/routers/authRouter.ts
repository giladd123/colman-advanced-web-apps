import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  googleSignIn,
  validate,
} from "../controllers/authController";
import {
  validateLogin,
  validateRegister,
  validateRefreshToken,
  validateGoogleCredential,
  authenticate,
} from "../middleware/authValidator";

export const authRouter = Router();

authRouter.post("/register", validateRegister, register);
authRouter.post("/login", validateLogin, login);
authRouter.post("/google", validateGoogleCredential, googleSignIn);
authRouter.post("/refresh", validateRefreshToken, refresh);
authRouter.post("/logout", validateRefreshToken, logout);
authRouter.get("/validate", authenticate, validate);
