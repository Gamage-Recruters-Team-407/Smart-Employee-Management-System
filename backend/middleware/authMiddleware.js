import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getTokenFromHeader = (authorization = "") => {
  if (!authorization.startsWith("Bearer ")) {
    return null;
  }
  return authorization.split(" ")[1];
};

export const protect = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization || "");
    let user = null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
      const userId = decoded.id || decoded.userId || decoded._id;

      if (!userId) {
        return res.status(401).json({ message: "Invalid authentication token payload." });
      }

      const dbUser = await User.findById(userId).select("-password");
      if (!dbUser) {
        return res.status(401).json({ message: "Not authorized. User not found." });
      }

      user = dbUser;
    } else if (req.headers["x-user-id"] && req.headers["x-user-role"]) {
      user = {
        id: String(req.headers["x-user-id"]),
        role: String(req.headers["x-user-role"])
      };
    }

    if (!user?.id || !user?.role) {
      return res.status(401).json({
        message: "Unauthorized. Provide Bearer token or x-user-id/x-user-role headers."
      });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: "Not authorized. Invalid or expired token." });
  }
};

export default protect;
