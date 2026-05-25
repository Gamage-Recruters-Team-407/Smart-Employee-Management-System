import express from "express";
import { getEmployees, createEmployee, getMyProfile } from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.get("/", getEmployees);
router.post("/", createEmployee);

export default router;
