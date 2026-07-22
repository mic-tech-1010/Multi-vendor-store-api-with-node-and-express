import express from "express";
import { getUserById, getUserProducts, listUsers } from "#controllers/admin/user.js";

const router = express.Router();

router.get("/", listUsers);
router.get("/:id", getUserById);
router.get("/:id/products", getUserProducts);

export default router;