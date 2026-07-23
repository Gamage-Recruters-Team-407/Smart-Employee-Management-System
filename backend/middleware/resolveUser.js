import Employee from "../models/Employee.js";

/**
 * Resolves the current user on req.user.
 *
 * TEMPORARY (until JWT login is done):
 *   Send header: X-Mock-Employee-Id: <employee MongoDB _id>
 *
 * FUTURE (when auth is ready):
 *   Set USE_JWT_AUTH=true in .env and send: Authorization: Bearer <token>
 *   Then replace the block below with jwt.verify(...) -> req.user = { id, email, role }
 */
export const resolveUser = async (req, res, next) => {
  try {
    if (process.env.USE_JWT_AUTH === "true") {
      return res.status(501).json({
        message: "JWT auth flag is on but not wired yet. Add jwt.verify in resolveUser.js",
      });
    }

    const mockId = req.headers["x-mock-employee-id"];
    if (!mockId) {
      return res.status(401).json({
        message:
          "Mock user required. Send header X-Mock-Employee-Id until JWT login is enabled.",
      });
    }

    const employee = await Employee.findById(mockId);
    if (!employee) {
      return res.status(401).json({ message: "Invalid mock employee id" });
    }

    req.user = {
      id: employee._id.toString(),
      email: employee.email,
      role: "employee",
    };
    next();
  } catch (error) {
    res.status(401).json({ message: error.message || "Authentication failed" });
  }
};
