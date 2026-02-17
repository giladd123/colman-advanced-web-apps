import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user";
import {
  JwtPayload,
  signAuthToken,
  signRefreshToken,
  validateRefreshToken,
} from "../utils/jwtUtils";

const googleClient = new OAuth2Client();

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

    const payload: JwtPayload = {
      userID: user._id.toString(),
      username: user.username,
      email: user.email,
    };
    const accessToken = signAuthToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return res.status(200).json({
      accessToken,
      refreshToken,
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

    const payload: JwtPayload = {
      userID: newUser._id.toString(),
      username: newUser.username,
      email: newUser.email,
    };
    const accessToken = signAuthToken(payload);
    const refreshToken = signRefreshToken(payload);

    newUser.refreshTokens.push(refreshToken);
    await newUser.save();

    return res.status(200).json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;

  try {
    const payload = validateRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const user = await User.findById(payload.userID);
    if (!user) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Check if refresh token exists in user's stored tokens
    if (!user.refreshTokens.includes(refreshToken)) {
      // Token reuse detected - invalidate all refresh tokens
      user.refreshTokens = [];
      await user.save();
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    // Remove old refresh token
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);

    // Generate new tokens
    const newPayload: JwtPayload = {
      userID: user._id.toString(),
      username: user.username,
      email: user.email,
    };
    const newAccessToken = signAuthToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    // Store new refresh token
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  const { refreshToken } = req.body;

  try {
    const payload = validateRefreshToken(refreshToken);
    if (payload) {
      const user = await User.findById(payload.userID);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(
          (t) => t !== refreshToken,
        );
        await user.save();
      }
    }
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function googleSignIn(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const googlePayload = ticket.getPayload();
    if (!googlePayload) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const { sub: googleId, email, name, picture } = googlePayload;

    if (!email) {
      return res.status(401).json({ error: "Google account has no email" });
    }

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link google account if user exists by email but not yet linked
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user from Google profile
      user = new User({
        email,
        username: name || email.split("@")[0],
        googleId,
        profileImage: picture,
      });
      await user.save();
    }

    const jwtPayload: JwtPayload = {
      userID: user._id.toString(),
      username: user.username,
      email: user.email,
    };
    const accessToken = signAuthToken(jwtPayload);
    const refreshToken = signRefreshToken(jwtPayload);

    user.refreshTokens.push(refreshToken);
    await user.save();

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    return res.status(401).json({ error: "Google authentication failed" });
  }
}

export async function validate(req: Request, res: Response, next: NextFunction) {
  // If we reach here, the authenticate middleware has already validated the token
  return res.status(200).json({ valid: true });
}
