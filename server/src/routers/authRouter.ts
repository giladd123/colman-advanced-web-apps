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

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already in use
 */
authRouter.post("/register", validateRegister, register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful, returns accessToken and refreshToken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
authRouter.post("/login", validateLogin, login);

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Sign in with Google OAuth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Google ID token
 *     responses:
 *       200:
 *         description: Google sign-in successful, returns accessToken and refreshToken
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid Google credential
 *       401:
 *         description: Google token verification failed
 */
authRouter.post("/google", validateGoogleCredential, googleSignIn);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Refresh the access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post("/refresh", validateRefreshToken, refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Logout and invalidate the refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Missing refresh token
 *       401:
 *         description: Invalid refresh token
 */
authRouter.post("/logout", validateRefreshToken, logout);

/**
 * @openapi
 * /api/auth/validate:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Validate the current access token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Token is missing or invalid
 */
authRouter.get("/validate", authenticate, validate);
