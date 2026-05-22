import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

/**
 * Middleware to protect routes and extract logged-in user & employee details.
 * Supports token verification and falls back to allow development testing when no token is present.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "supersecretkey"
      );

      // Find user in database
      req.user = await User.findById(decoded.id).select("-password");

      if (req.user) {
        // Link logged-in User to their corresponding Employee record by email
        const employee = await Employee.findOne({ email: req.user.email });
        if (employee) {
          req.employee = employee;
        }
      }

      return next();
    } catch (error) {
      console.error("Auth Middleware Error:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  // If no token is provided, allow the request to proceed (for dev/Postman testing with raw IDs).
  // Once the login module developer is done, they can make this check strict.
  next();
};
