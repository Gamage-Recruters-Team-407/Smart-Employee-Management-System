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
