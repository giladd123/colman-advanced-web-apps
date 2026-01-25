import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import jwt from "jsonwebtoken";

export async function login(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: parseInt(process.env.JWT_TOKEN_EXPIRATION!),
    });
    return res.status(200).json({
      accessToken: token,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { username, email, password } = req.body;
  try {
    const user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json({ error: "Email already in use" });
    }
    const newUser = new User({ username, email, password });
    await newUser.save();

    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET!, {
      expiresIn: parseInt(process.env.JWT_TOKEN_EXPIRATION!),
    });

    return res.status(200).json({
      token,
      user: {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

const logout = async (req: Request, res: Response, next: NextFunction) => {
  // Logout logic here
};
