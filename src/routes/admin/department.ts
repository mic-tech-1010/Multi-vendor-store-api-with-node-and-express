import express from "express";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  listDepartments,
  updateDepartment,
} from "#controllers/admin/department.js";
import { validateBody } from "#lib/validator.js";
import { CreateDepartmentSchema } from "#schemas/validation/departmentSchema.js";

const router = express.Router();

router.get("/", listDepartments);
router.get("/:id", getDepartmentById);
router.post("/", validateBody(CreateDepartmentSchema), createDepartment);
router.patch("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;