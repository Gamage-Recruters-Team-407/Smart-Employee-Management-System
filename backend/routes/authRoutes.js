import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  forgotPassword,
  verifyResetCode,
  resetPasswordWithCode,
  verifyResetToken,
  resetPasswordByToken,
} from "../controllers/authController.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);

// Password reset routes (JWT based)
router.route("/reset-password/:token")
  .get(verifyResetToken)      // GET: Verify token
  .put(resetPasswordByToken); // PUT: Reset password

// Password reset routes (Code based - for backward compatibility)
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password-with-code", resetPasswordWithCode);

// Protected routes
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getCurrentUser);

export default router;