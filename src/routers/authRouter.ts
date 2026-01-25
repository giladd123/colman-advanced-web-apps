import { Router } from "express";
import { register, login } from "../controllers/authController";
import { validateLogin, validateRegister } from "../middleware/authValidator";

export const authRouter = Router();

authRouter.post("/register", validateRegister, register);
authRouter.post("/login", validateLogin, login);
