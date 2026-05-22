import express from "express";
import {
  getEmployees,
  createEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";

const router = express.Router();

router.route("/").get(getEmployees).post(createEmployee);
router.route("/:id").delete(deleteEmployee);

export default router;
