<<<<<<< HEAD
/**
 *
 * Attaches a mock req.user object to every request so that
 * protected routes can reference req.user without failing.
 * Replace with real JWT verification in a later sprint.
 */
const mockAuth = (req, res, next) => {
  // Attach a mock user — swap this for real JWT logic later
  req.user = {
    id: "mock-user-id",
    name: "Admin User",
    role: "admin",
  };
  next();
};

export default mockAuth;
=======
const jwt = require("jsonwebtoken");

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = { protect };
>>>>>>> 93cfd01ca649ed6f9c452646925a0e90c0c049f0
