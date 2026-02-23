import { Request, Router } from "express";
import {
  getAllUsers,
  editUser,
  deleteUser,
} from "../controllers/userController";
import {
  getUserByIdValidator,
  editUserPreUploadValidator,
  editUserBodyValidator,
  deleteUserValidator,
} from "../middleware/userValidator";
import { authenticate } from "../middleware/authValidator";
import { upload } from "../middleware/upload";

export const userRouter = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get all users
 *     description: Returns all users with sensitive fields (password, refreshTokens) stripped.
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Failed to fetch users
 */
userRouter.get("/", async (req: Request, res) => {
  try {
    const users = await getAllUsers();
    const sanitizedUsers = users.map((user) => {
      const { password, refreshTokens, ...userWithoutSensitiveData } =
        user.toObject();
      return userWithoutSensitiveData;
    });
    return res.status(200).json(sanitizedUsers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get a user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: The requested user (without sensitive data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 */
userRouter.get("/:id", getUserByIdValidator, async (req: Request, res) => {
  const id = req.params.id as string;

  try {
    const user = (req as any).targetUser;
    const { password, refreshTokens, ...userWithoutSensitiveData } =
      user.toObject();
    return res.status(200).json(userWithoutSensitiveData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: `Failed to fetch user ${id}` });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update a user's profile
 *     description: >
 *       Updates the user profile. All fields are optional.
 *       Send as multipart/form-data to include a profile image.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: User updated successfully (without sensitive data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update user
 */
// Validation is split: ID/auth checks run before upload to avoid saving files
// for unauthorized requests. Body validation runs after upload because multer
// must parse multipart/form-data before req.body is available.
userRouter.put(
  "/:id",
  authenticate,
  editUserPreUploadValidator,
  upload.single("profileImage"),
  editUserBodyValidator,
  async (req: Request, res) => {
    const id = req.params.id as string;
    const { email, username, password } = req.body;

    const updateData: {
      email?: string;
      username?: string;
      password?: string;
      profileImage?: string;
    } = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (password) updateData.password = password;

    if (req.file) {
      updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    try {
      const updatedUser = await editUser(updateData, id);
      const {
        password: _,
        refreshTokens,
        ...userWithoutSensitiveData
      } = updatedUser!.toObject();
      return res.status(200).json(userWithoutSensitiveData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  },
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     summary: Delete a user account
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */
userRouter.delete(
  "/:id",
  authenticate,
  deleteUserValidator,
  async (req: Request, res) => {
    const id = req.params.id as string;

    try {
      await deleteUser(id);
      return res
        .status(200)
        .json({ message: `The user ${id} deleted successfully` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: `Failed to delete user ${id}` });
    }
  },
);
