import express from "express";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "#controllers/admin/category.js";
import { validateBody } from "#lib/validator.js";
import { CreateCategorySchema } from "#schemas/validation/categorySchema.js";

const router = express.Router();

router.get("/", listCategories);
router.get("/:id", getCategoryById);
router.post("/", validateBody(CreateCategorySchema), createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;