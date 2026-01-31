import { Request, Router } from "express";
import {
  getAllUsers,
  editUser,
  deleteUser,
} from "../controllers/userController";
import {
  getUserByIdValidator,
  editUserValidator,
  deleteUserValidator,
} from "../middleware/userValidator";
import { authenticate } from "../middleware/authValidator";

export const userRouter = Router();

userRouter.get("/", authenticate, async (req: Request, res) => {
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

userRouter.get(
  "/:id",
  authenticate,
  getUserByIdValidator,
  async (req: Request, res) => {
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
  },
);

userRouter.put(
  "/:id",
  authenticate,
  editUserValidator,
  async (req: Request, res) => {
    const id = req.params.id as string;
    const { email, username, password } = req.body;

    const updateData: { email?: string; username?: string; password?: string } =
      {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (password) updateData.password = password;

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
