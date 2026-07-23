import { protect } from "./authMiddleware.js";
import { resolveUser } from "./resolveUser.js";

/**
 * JWT (Bearer) for logged-in users, or X-Mock-Employee-Id for dev mock sessions.
 */
export const resolveTaskUser = (req, res, next) => {
  if (req.headers["x-mock-employee-id"]) {
    return resolveUser(req, res, next);
  }
  return protect(req, res, next);
};
