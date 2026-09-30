import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { getJwtSecret } from "../utils/jwtSecret.js";
import { userCache } from "../utils/cache.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());

    // Check in-memory cache first (60s TTL) to avoid DB hit on every request
    const cacheKey = `user:${decoded.id}`;
    let user = userCache.get(cacheKey);

    if (!user) {
      user = await User.findById(decoded.id).select("-password");
      if (user) {
        userCache.set(cacheKey, user);
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid token.",
    });
  }
};