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

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-code", verifyResetCode);
router.post("/reset-password-with-code", resetPasswordWithCode);
router.get("/reset-password/:token/verify", verifyResetToken);
router.put("/reset-password/:token", resetPasswordByToken);

export default router;