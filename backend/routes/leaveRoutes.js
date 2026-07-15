import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance,
  revertLeaveStatus,
} from "../controllers/leaveController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const medicalUploadDir = path.join(process.cwd(), "uploads", "medical");

if (process.env.VERCEL !== "1" && !fs.existsSync(medicalUploadDir)) {
  fs.mkdirSync(medicalUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, medicalUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `medical_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) cb(null, true);
    else cb(new Error("Only images and PDFs are allowed"));
  },
});

router.post("/apply", protect, upload.single("medicalDocument"), applyLeave);
router.get("/my-leaves", protect, getMyLeaves);
router.get("/balance", protect, getLeaveBalance);
router.put("/cancel/:id", protect, cancelLeave);
router.get("/all", protect, authorize("HR", "Admin", "Manager"), getAllLeaves);
router.put("/status/:id", protect, authorize("HR", "Admin", "Manager"), updateLeaveStatus);
router.put("/revert/:id", protect, authorize("HR", "Admin"), revertLeaveStatus);

// module.exports = router;
export default router;