// import express from "express";
// <<<<<<< HEAD
// import { getEmployees, createEmployee, getMyProfile } from "../controllers/employeeController.js";
// import { protect } from "../middleware/authMiddleware.js";

// const router = express.Router();

// router.get("/me", protect, getMyProfile);
// router.get("/", getEmployees);
// router.post("/", createEmployee);
// =======
// import {
//   getEmployees,
//   createEmployee,
//   getEmployeeById,
//   getEmployeeTasks,
// } from "../controllers/employeeController.js";

// const router = express.Router();

// router.get("/", getEmployees);
// router.post("/", createEmployee);
// router.get("/:id/tasks", getEmployeeTasks);
// router.get("/:id", getEmployeeById);
// >>>>>>> 0f94113dbedca67732fee7ea52e1607ba7238de8

// export default router;
import express from "express";
import {
  getEmployees,
  createEmployee,
  getMyProfile,
  getEmployeeById,
  getEmployeeTasks,
} from "../controllers/employeeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🚨 විශේෂ සටහන: dynamic routes (/:id) වලට කලින් ස්ථාවර routes (/me) අනිවාර්යයෙන්ම දැමිය යුතුය.
router.get("/me", protect, getMyProfile);

router.get("/", getEmployees);
router.post("/", createEmployee);

router.get("/:id/tasks", getEmployeeTasks);
router.get("/:id", getEmployeeById);

export default router;