import express from "express";
import {
  reportIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  editIssue,
  deleteIssue,
  getIssueStats,
} from "../controllers/issueController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Employee routes
router.post("/report", upload.single("attachment"), reportIssue);
router.get("/my", getMyIssues);
router.get("/id/:id", getIssueById);
router.put("/:id", upload.single("attachment"), editIssue);
router.delete("/:id", deleteIssue);

// HR/Admin routes
router.get("/", getAllIssues);
router.patch("/:id/status", updateIssueStatus);
router.get("/stats", getIssueStats);

export default router;