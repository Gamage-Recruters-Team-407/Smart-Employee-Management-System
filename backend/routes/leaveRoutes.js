const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  cancelLeave,
  getLeaveBalance,
} = require("../controllers/leaveController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/medical/");
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
router.get("/all", protect, authorizeRoles("HR", "Admin"), getAllLeaves);
router.put("/status/:id", protect, authorizeRoles("HR", "Admin", "Manager"), updateLeaveStatus);

module.exports = router;